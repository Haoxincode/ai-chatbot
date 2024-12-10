import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/app/(auth)/auth';

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 10 * 1024 * 1024, {
      message: 'File size should be less than 5MB',
    })
    // Update the file type based on the kind of files you want to accept
    // .refine((file) => ['image/jpeg', 'image/png'].includes(file.type), {
    //   message: 'File type should be JPEG or PNG',
    // }),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (request.body === null) {
    return new Response('Request body is empty', { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(', ');

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Get filename from formData since Blob doesn't have name property
    const filename = (formData.get('file') as File).name;
    const fileBuffer:any = await file.arrayBuffer();
    let user:any=session&&session.user ?session.user.email:'v0'

    const formDataNew = new FormData();
    let fl:any=formData.get('file')
    formDataNew.append('file', formData.get('file') as File);
    formDataNew.append("userid",user)
    console.log(formDataNew)
    try {
      const data = await put(`${filename}`, fileBuffer, {
        access: 'public',
      });

      let apiKey=process.env.DIFY_API_SEARCHPCAP_KEY; 
      const response= await fetch('http://43.129.162.15:9003/api/upload',{
        method: 'POST',
        // headers: {
        //   //'Authorization': `Bearer ${apiKey}`,
        //   'Content-Type': 'multipart/form-data',
        // },
        body:formDataNew
      })

      console.log(response)
      if(!data.contentType){
        data.contentType='application/vnd.tcpdump.pcapng'
      }
      

      let files:any=[]
      // const response = await fetch('https://api.dify.ai/v1/workflows/run', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${apiKey}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     inputs: { },
      //     response_mode: "blocking",
      //     user: user,
      //     files:[{type :"document",transfer_method:"remote_url",url:data.url}]
      //   }),
      // })
    
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`+apiKey+JSON.stringify(response));
      }
      console.log(response.json())
  
      return NextResponse.json(data);
    } catch (error) {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 },
    );
  }
}
