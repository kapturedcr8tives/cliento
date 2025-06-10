import { createServerClient } from "./supabase"

export async function initializeDatabase() {
  const supabase = createServerClient()

  console.log("Initializing database...")

  try {
    // Check if tables exist
    const { data: tablesExist, error: checkError } = await supabase.from("users").select("id").limit(1)

    if (checkError && checkError.code === "42P01") {
      console.log("Tables don't exist. Creating schema...")

      // Create tables (simplified version)
      await createBasicSchema(supabase)

      console.log("Schema created successfully!")
      return { success: true, message: "Database initialized successfully" }
    } else {
      console.log("Tables already exist. Skipping initialization.")
      return { success: true, message: "Database already initialized" }
    }
  } catch (error) {
    console.error("Error initializing database:", error)
    return { success: false, message: "Error initializing database", error }
  }
}

async function createBasicSchema(supabase: any) {
  // Create users table
  await supabase.rpc("create_users_table", {})

  // Create clients table
  await supabase.rpc("create_clients_table", {})

  // Create projects table
  await supabase.rpc("create_projects_table", {})

  // Create tasks table
  await supabase.rpc("create_tasks_table", {})

  // Create leads table
  await supabase.rpc("create_leads_table", {})

  // Create proposals table
  await supabase.rpc("create_proposals_table", {})

  // Create invoices table
  await supabase.rpc("create_invoices_table", {})
}
