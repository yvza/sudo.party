import React from 'react'
import { randomizeCharacter } from '@/lib/utils'
import Markdown from 'markdown-to-jsx'
interface MockingFakeContentProps {
  content: string
}

const MockingFakeContent: React.FC<MockingFakeContentProps> = ({ content }) => {
  const rewrite = () => {
    // let withinTag = false;
    const originalText = content;
    const modifiedText = originalText.split('').map((char) => {
      // if (char === '<') {
      //   withinTag = true;
      //   return char;
      // }

      // if (withinTag && char !== '>') {
      //   return char;
      // }

      // withinTag = false;

      if (char.match(/[a-zA-Z0-9]/)) {
        return randomizeCharacter();
      }

      return char;
    });

    return modifiedText.join('');
  }

  return (
    <Markdown>{rewrite()}</Markdown>
  )
}

export default MockingFakeContent
