import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import { ProtectedRoute } from "./lib/protected-route";
import Navbar from "@/components/ui/navbar";
import ProfilePage from "@/pages/profile-page";
import MatchesPage from "@/pages/matches-page";
import MessagingPage from "@/pages/messaging-page";
import { useEffect, useState } from 'react';
import { supabase } from '/Users/jadynfleming/Downloads/roomeet/client/src/supabaseClient.ts'; // adjust path as needed

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={MatchesPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/matches" component={MatchesPage} />
      <ProtectedRoute path="/messaging" component={MessagingPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() 
{

  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase.from('users').select('*');
      if (error) console.error(error);
      else setUsers(data || []);
    }
    fetchUsers();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Navbar />
        <Router />
        <Toaster />
        <div>
          <h1>Supabase Users</h1>
          <pre>{JSON.stringify(users, null, 2)}</pre>
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
