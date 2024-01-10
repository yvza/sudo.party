import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { allPosts } from 'contentlayer/generated';
import { displaySinglePost } from './lib/utils';

export function middleware(request: NextRequest) {
  // if (request.nextUrl.pathname.startsWith('/posts')) {
      // let key: any = '0day'
      // if (!!!key) { console.log('Kosong!'); return; }

      // if (key !== '0day') { console.log('Salah!'); return; }

      // console.log('masuk')
      // console.log(request)
      // return NextResponse.rewrite(new URL('/blog', request.url))
      // return NextResponse.rewrite(new URL('/about-2', request.url))
      /**
       * Thinking about the flow :')
       */
  // }
}