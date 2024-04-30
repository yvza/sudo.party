"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { lang } from "@/lib/constants"
import { useState, useEffect } from "react"
import { useUnicorn as doLogin } from "@/lib/hooks/dummy"
import axios from "axios"
import { ReloadIcon } from "@radix-ui/react-icons"
import { useRouter } from "next/navigation"
import { isProd } from "@/config"
import localFont from 'next/font/local'
import Link from "next/link"

const honkFont = localFont({ src: '../fonts/Honk-Regular.ttf' })

const formSchema = z.object({
  key: z.string().min(35, {
    message: lang.invalid,
  }),
})

const ProfileForm = () => {
  const { toast } = useToast()
  const [chosenOption, setChosenOption] = useState('option-one')
  const [disablingForm, setDisableForm] = useState(false)
  const [buttonLoading, setButtonLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false);
  const { push } = useRouter()

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      key: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setButtonLoading(true);

    try {
      const response = await axios.post('/api/auth', values);
      if (!isProd) console.log(response);
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
        push('/blog')
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

  return (
    <div className="w-full h-screen flex items-center justify-center bg-slate-50">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 w-80 p-5 rounded-md bg-white shadow-md"
        >
          <Link href='/blog'>
            <h1 className={`text-center text-5xl font-black ${honkFont.className}`}>{lang.siteUrl}</h1>
          </Link>
          <RadioGroup
            defaultValue={chosenOption}
            onValueChange={setChosenOption}
            name="option">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option-one" id="option-one" />
                <Label htmlFor="option-one">{lang.sudoPartyPass}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option-two" id="option-two" />
                <Label htmlFor="option-two">{lang.sgbCode}</Label>
              </div>
          </RadioGroup>

          <FormField
            disabled={disablingForm}
            control={form.control}
            name="key"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Access Key</FormLabel>
                <FormControl>
                  <Input placeholder="Secret code" {...field} />
                </FormControl>
                <FormDescription>
                  {chosenOption === 'option-two' && <em className="text-red-600">{lang.currentlyNotAvailable}</em>}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {renderButton()}
        </form>
      </Form>
    </div>
  )
}

export default ProfileForm