"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { lang } from "@/lib/constants"
import { useState, useEffect } from "react"
import axios from "axios"
import { ReloadIcon } from "@radix-ui/react-icons"
import { useRouter } from "next/navigation"
import HeaderBrand from "@/components/HeaderBrand"
import { useSelector, useDispatch } from "react-redux"
import { DefaultState } from "@/lib/features/user/info"
import { todoAdded } from "@/lib/features/user/info"
import { addTasks } from "@/lib/features/user/mocktest"
import { Connector, useConnect, useAccount, useDisconnect, useEnsAvatar, useEnsName } from 'wagmi'
import Image from "next/image"
import WalletOptions from "@/components/blog/walletConnect/WalletOptions"
import Account from "@/components/blog/walletConnect/Account"
import SignInWithEthereum from "@/components/blog/siwe/SignInWithEthereum"

declare var window: any

const formSchema = z.object({
  key: z.string().min(35, {
    message: lang.invalid,
  }),
})

const ProfileForm = () => {
  const { connectors, connect } = useConnect()
  const { toast } = useToast()
  const [chosenOption, setChosenOption] = useState('option-one')
  const [disablingForm, setDisableForm] = useState(false)
  const [buttonLoading, setButtonLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter()
  const [connectedAccount, setConnectedAccount] = useState('')
  // const test = useSelector(state => state.todos)
  // const tasks = useSelector(state => state.tasks)
  const dispatch = useDispatch()
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      key: "",
    },
  })
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: ensName } = useEnsName({ address })
  const { data: ensAvatar } = useEnsAvatar({ name: ensName! })
  const { isConnected } = useAccount()

  useEffect(() => {
    switch (chosenOption) {
      case 'option-one':
        setDisableForm(false)
        break;
      case 'option-two':
        setDisableForm(true)
        break;

      default:
        setDisableForm(false)
        break;
    }
  }, [chosenOption]);

  useEffect(() => {
    router.prefetch('/blog')
  }, [router])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setButtonLoading(true);

    try {
      const response = await axios.post('/api/auth', values);
      if (response.data === 'Not found') {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: "There was a problem with your request."
        })
        setButtonLoading(false)
        return
      }

      setIsSuccess(true);
      setDisableForm(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request."
      })
      setButtonLoading(false);
    }
  }

  const renderButtonContent = () => {
    if (buttonLoading) {
      return <>
        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
        Please wait
      </>
    }

    return <>Submit</>
  }

  const renderButton = () => {
    if (isSuccess) {
      setTimeout(() => {
        router.push('/blog')
      }, 250)
      return <em className="text-green-500 text-sm">Success, redirecting...</em>
    }

    return <Button
      disabled={buttonLoading}
      type="submit"
    >
      {renderButtonContent()}
    </Button>
  }

  const triggerWeb3 = async () => {
    // dispatch({ type: 'TEST_TRIGGER_SAGA' })
    // return
    if (!window.ethereum) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "U must have installed evm wallet."
      })
      return
    }

    // instantiate Web3 with the injected provider
    // const web3 = new Web3(window.ethereum);

    try {
      //request user to connect accounts (Metamask will prompt)
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    } catch (error) {
      const err = error as { code?: number; message?: string };
      return toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: err.message
      })
    }

    //get the connected accounts
    // const accounts = await web3.eth.getAccounts();

    //show the first connected account in the react page
    // setConnectedAccount(accounts[0]);

    // console.log('Connected account: ', accounts[0])
    // console.log('Connected : ', accounts)

    // send the address to api
    // fetch first on db its exist or no
    // if not exist, create one, and return the data
    // if exist return the data
  }

  const connectWallet = () => {
    if (isConnected) return <Account />
    return connectors.map((connector) => (
      <WalletOptions
        key={connector.uid}
        connector={connector}
        onClick={() => connect({ connector })}
      />
    ))
  }

  return (
    // <div className="w-full h-screen flex items-center justify-center bg-slate-50 dark:bg-black">
    //   <Form {...form}>
    //     {/* <>{JSON.stringify(test)}</>
    //     <h1>&nbsp;</h1>
    //     <>{JSON.stringify(tasks)}</> */}
    //     <form
    //       onSubmit={form.handleSubmit(onSubmit)}
    //       className="space-y-8 w-80 p-5 rounded-md bg-white shadow-md dark:border dark:border-white dark:bg-black"
    //     >
    //       <HeaderBrand sloganOn={false} ref={glitch.ref} />
    //       <RadioGroup
    //         defaultValue={chosenOption}
    //         onValueChange={setChosenOption}
    //         name="option">
    //           <div className="flex items-center space-x-2">
    //             <RadioGroupItem value="option-one" id="option-one" />
    //             <Label htmlFor="option-one">{lang.sudoPartyPass}</Label>
    //           </div>
    //           <div className="flex items-center space-x-2">
    //             <RadioGroupItem value="option-two" id="option-two" />
    //             <Label htmlFor="option-two">{lang.sgbCode}</Label>
    //           </div>
    //       </RadioGroup>

    //       <Button variant="outline" onClick={() => triggerWeb3()}>Connect Wallet</Button>

    //       <FormField
    //         disabled={disablingForm}
    //         control={form.control}
    //         name="key"
    //         render={({ field }) => (
    //           <FormItem>
    //             <FormLabel>Access Key</FormLabel>
    //             <FormControl>
    //               <Input placeholder="Secret code" {...field} />
    //             </FormControl>
    //             <FormDescription>
    //               {chosenOption === 'option-two' && <em className="text-red-600">{lang.currentlyNotAvailable}</em>}
    //             </FormDescription>
    //             <FormMessage />
    //           </FormItem>
    //         )}
    //       />

    //       {renderButton()}
    //     </form>
    //   </Form>
    // </div>
    <div className="w-full h-screen flex items-center justify-center bg-slate-50 dark:bg-black">
      <div className="flex flex-col space-y-8 w-80 p-5 rounded-md bg-white shadow-md dark:border dark:border-white dark:bg-black">
        <HeaderBrand sloganOn={false} />
        {/* <Button className="self-center" variant="outline" onClick={() => triggerWeb3()}>Connect Wallet</Button> */}
        {connectWallet()}
        <SignInWithEthereum />
      </div>
    </div>
  )
}

export default ProfileForm