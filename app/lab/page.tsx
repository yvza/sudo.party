'use client'
import React, { useState, useEffect } from 'react';
import { generateSubscriptionPass, decryptSubscriptionPass } from '@/lib/utils';

import { db, dynamoConfig } from '@/config';

export default function Page() {
  const [id, setId] = useState<string>('');
  const [raw, setRaw] = useState<{ randomString: string; timestamp: number } | null>(null);

  const lol = async (input: string) => {
    try {
      const params = {
        TableName: 'sudopartypass',
        Key: {
          pk: input,
          sk: 'yuza'
        }
      }
      const response = await db.get(params)

      if (!response) {
        console.log('No data found for the given key.');
        return
      }

      console.log(response)
    } catch (error) {
      console.error('error', error)
    }
  }
  useEffect(() => {
    // const generated = generateSubscriptionPass();
    // setId(generated);
    // const decrypted = decryptSubscriptionPass('msmtde8SwSDYGn5y+kWIaw==:pv0ods9SENw5NI8WcGcjmnFBeu9UEUrxElvMudZZdWs=');
    // setRaw(decrypted);
    lol('Rgmk8JZ/OjPuS6JgfqvE0A==:g/gLF6+QST2HOCOAkurIkeTnf1U1Ed8TYc2jU0oSWgY=')
  }, []);

  return (
    <div>
      {/* {id} x {raw ? `SP2${raw.randomString}${raw.timestamp}` : 'Decrypting...'}
      {raw ? `SP2${raw.randomString}${raw.timestamp}` : 'Decrypting...'} */}
      {/* {id} */}
    </div>
  );
}
