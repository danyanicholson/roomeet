import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function UsersTest() {
  const [users, setUsers] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase.from("users").select("*");
      if (error) {
        console.error("Supabase error:", error.message);
        setErrorMsg(error.message);
      } else {
        console.log("Fetched users:", data);
        setUsers(data || []);
      }
    }
    fetchUsers();
  }, []);

  return (
    <div>
      <h1>Test: Supabase Users</h1>
      {errorMsg && <p style={{ color: "red" }}>Error: {errorMsg}</p>}
      <pre>{JSON.stringify(users, null, 2)}</pre>
    </div>
  );
}
