import { getMe } from "@/action/profileHandler";
import { Profile } from "@/components/profile/Profile";

const ProfilePage = async () => {
  const userData = await getMe();

  return (
    <div className="p-4">
      <Profile userData={userData} />
    </div>
  );
};

export default ProfilePage;
