import { useContext, useState } from "react";
import axios from "axios";
import { UserContext } from "./UserContext";

export default function RegisterAndLoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginOrRegister, setisLoginOrRegister] = useState("login");

  const { setUsername: setLoggedInUserName, setId } = useContext(UserContext);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const url =
      isLoginOrRegister === "register"
        ? "http://localhost:4000/register"
        : "http://localhost:4000/login";
    const { data } = await axios.post(
      url,
      { username, password },
      {
        withCredentials: true,
      }
    );

    setLoggedInUserName(username);
    setId(data.id);
  };

  return (
    <div className="bg-blue-50 h-screen flex items-center">
      <form className="w-64 mx-auto mb-12" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="username"
          className="block w-full rounded-md p-2 mb-2 border"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="password"
          className="block w-full rounded-md p-2 mb-2 border"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-500 text-white mx-auto w-full rounded-md p-2"
        >
          {isLoginOrRegister === "login" ? "Login" : "Register"}
        </button>
        <div className="text-center mt-2">
          {isLoginOrRegister === "register" && (
            <div>
              Already a member?
              <button onClick={() => setisLoginOrRegister("login")}>
                Login here
              </button>
            </div>
          )}

          {isLoginOrRegister === "login" && (
            <div>
              New here?
              <button onClick={() => setisLoginOrRegister("register")}>
                Register here
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
