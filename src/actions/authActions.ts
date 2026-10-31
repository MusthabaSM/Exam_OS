'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import prisma from '@/lib/db/prisma'

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const parsed = authSchema.safeParse({ email, password })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signupAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const parsed = authSchema.safeParse({ email, password })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function demoLoginAction() {
  const email = 'demo@exam-prep.com'
  const password = 'demo123456'

  const supabase = await createClient()

  let { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  let authData: any = data

  // If user doesn't exist, create it
  if (error && error.message.includes('Invalid login credentials')) {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      redirect('/login?error=SignupFailed')
    }
    
    // Sometimes signup doesn't auto-login if email confirmation is required,
    // but in development/demo environments, it usually works or we can login again.
    // Let's ensure we are logged in.
    if (!signUpData.session) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) redirect('/login?error=LoginFailed')
      authData = signInData
    } else {
      authData = signUpData
    }
  } else if (error) {
    redirect('/login?error=AuthFailed')
  }

  const userId = authData?.user?.id

  if (userId) {
    // Check and create demo exams
    const existingExams = await prisma.exam.findMany({
      where: { userId }
    })

    const requiredExams = ['JEE Main', 'NEET UG', 'CAT']
    
    for (const examName of requiredExams) {
      if (!existingExams.find(e => e.name === examName)) {
        await prisma.exam.create({
          data: {
            userId,
            name: examName,
            organization: 'Demo Org',
            status: 'UPCOMING',
          }
        })
      }
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
