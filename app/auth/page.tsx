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

import { useState, useEffect } from "react"

const formSchema = z.object({
  key: z.string().min(2, {
    message: "Whoops!",
  }),
})

const ProfileForm = () => {
  const { toast } = useToast()
  const [chosenOption, setChosenOption] = useState('option-one')
  const [disablingForm, setDisableForm] = useState(false)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      key: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
    toast({
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(values, null, 2)}</code>
        </pre>
      ),
    })
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <RadioGroup
          defaultValue={chosenOption}
          onValueChange={setChosenOption}
          name="option">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option-one" id="option-one" />
              <Label htmlFor="option-one">sudo.party pass</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option-two" id="option-two" />
              <Label htmlFor="option-two">SGB Code</Label>
            </div>
        </RadioGroup>

        <FormField
          disabled={disablingForm}
          control={form.control}
          name="key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Key</FormLabel>
              <FormControl>
                <Input placeholder="Secret code" {...field} />
              </FormControl>
              <FormDescription>
                Input your key.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}

export default ProfileForm