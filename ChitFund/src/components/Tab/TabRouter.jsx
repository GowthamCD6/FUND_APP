import AdminTab from "./ATab/AdminTab";
import UserTabs from "./UTab/UserTab";

export default function TabRouter({ route }) {
  const role = route?.params?.role || 'user';
  
  console.log('TabNavigator received role:', role);
  
  if (role === 'Admin') {
    return <AdminTab />;
  }
  return <UserTabs />;
}