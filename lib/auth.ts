import { supabase } from "./supabase"

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Sign in error:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Sign in exception:", error)
    return { data: null, error: { message: "An unexpected error occurred" } }
  }
}

export async function signUp(email: string, password: string, fullName: string, workspaceName: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          workspace_name: workspaceName,
        },
      },
    })

    if (error) {
      console.error("Sign up error:", error)
      return { data: null, error }
    }

    // If user is created successfully, create workspace and user profile
    if (data.user && !error) {
      try {
        // Create workspace
        const { data: workspace, error: workspaceError } = await supabase
          .from("workspaces")
          .insert({
            name: workspaceName,
            owner_id: data.user.id,
          })
          .select()
          .single()

        if (workspaceError) {
          console.error("Workspace creation error:", workspaceError)
        }

        // Create user profile
        if (workspace) {
          const { error: userError } = await supabase.from("users").insert({
            id: data.user.id,
            email,
            full_name: fullName,
            workspace_id: workspace.id,
            role: "admin",
          })

          if (userError) {
            console.error("User profile creation error:", userError)
          }
        }
      } catch (profileError) {
        console.error("Profile creation exception:", profileError)
      }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Sign up exception:", error)
    return { data: null, error: { message: "An unexpected error occurred" } }
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Sign out error:", error)
    }
    return { error }
  } catch (error) {
    console.error("Sign out exception:", error)
    return { error: { message: "An unexpected error occurred" } }
  }
}

export async function getCurrentUser() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("Get user error:", error)
      return null
    }

    return session?.user || null
  } catch (error) {
    console.error("Get user exception:", error)
    return null
  }
}
