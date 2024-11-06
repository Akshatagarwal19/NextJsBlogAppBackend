import formidable from 'formidable';
import { NextRequest } from 'next/server';
import { Readable } from 'stream';
import { IncomingMessage,  IncomingHttpHeaders } from 'http'; 


function convertToNodeReadable(body: ReadableStream<Uint8Array>): Readable {
  const reader = body.getReader();
  const readable = new Readable({
    async read() {
      const { done, value } = await reader.read();
      this.push(done ? null : value);
    },
  });
  return readable;
}


interface ExtendedReadable extends Readable {
  url: string;
  method: string;
  headers: IncomingHttpHeaders;
}



export async function uploadHandler(req: NextRequest) {
  const form = formidable({
    keepExtensions: true,
    uploadDir: './uploads',
    maxFileSize: 100 * 1024 * 1024, // 100 MB limit
  });

  try {
    if (!req.body) {
      throw new Error("Request body is empty");
    }

    
    const readableBodyStream = convertToNodeReadable(req.body);

    
    const nodeReq = readableBodyStream as ExtendedReadable;
    nodeReq.url = req.url!;
    nodeReq.method = req.method!;
    nodeReq.headers = Object.fromEntries(req.headers);

    console.log('Node request simulated:', nodeReq);
    
    return new Promise((resolve, reject) => {
      form.parse(nodeReq as IncomingMessage, (err, fields, files) => {
        if (err) {
          return reject(new Error('Formidable parsing failed'));
        }

        console.log('Parsed Fields:', fields);
        console.log('Parsed Files:', files);

        resolve({ fields, files });
      });
    });
  } catch (error) {
    
    const err = error as Error;
    console.error('Error during upload processing:', err.message);
    throw new Error(err.message);
  }
}
