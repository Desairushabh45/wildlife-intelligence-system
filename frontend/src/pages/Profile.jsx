import { User, Calendar, Shield, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { Card } from "../components/ui/Card.jsx";

function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 lg:px-6">
      <h1 className="mb-6 text-2xl font-bold text-ink dark:text-white">My Profile</h1>
      
      <Card className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-8">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-canopy text-3xl font-bold text-white shadow-sm">
          {user.full_name?.charAt(0).toUpperCase() || "U"}
        </div>
        
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-ink dark:text-white">{user.full_name || "Unknown User"}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Mail size={16} className="text-slate-400 dark:text-slate-500" />
                {user.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Shield size={16} className="text-slate-400 dark:text-slate-500" />
                <span className="capitalize">{user.role?.replaceAll("_", " ")}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={16} className="text-slate-400 dark:text-slate-500" />
                Joined {new Date(user.created_at || Date.now()).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </main>
  );
}

export default Profile;
