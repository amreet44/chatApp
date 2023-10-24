import { useContext } from "react";
import RegisterAndLoginForm from "./Register";
import { UserContext } from "./UserContext";

export default function Routes() {
  const { username } = useContext(UserContext);

  if (username) {
    return "logged in" + username;
  }
  return <RegisterAndLoginForm />;
}
