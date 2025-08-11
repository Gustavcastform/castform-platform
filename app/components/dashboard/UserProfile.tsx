import { User } from 'next-auth';
import UserDropdown from "./UserDropdown";

export default function UserProfile({ user, isCollapsed }: { user: User | null, isCollapsed: boolean }) {
    if (!user) {
        return null;
    }
    
    return <UserDropdown user={user} isCollapsed={isCollapsed} />;
}