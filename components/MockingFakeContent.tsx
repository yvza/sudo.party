import React from 'react'
import { randomizeCharacter } from '@/lib/utils'

interface MockingFakeContentProps {
  content: string
}

const MockingFakeContent: React.FC<MockingFakeContentProps> = ({ content }) => {
  const rewrite = () => {
    let withinTag = false;
    const originalText = content;
    const modifiedText = originalText.split('').map((char) => {
      if (char === '<') {
        withinTag = true;
        return char;
      }

      if (withinTag && char !== '>') {
        return char;
      }

      withinTag = false;

      if (char.match(/[a-zA-Z]/)) {
        return randomizeCharacter();
      }

      return char;
    });

    return modifiedText.join('');
  }

  return (
    <div className="[&>*]:mb-3 [&>*:last-child]:mb-0" dangerouslySetInnerHTML={{ __html:rewrite() }} />
  )
}

export default MockingFakeContent
