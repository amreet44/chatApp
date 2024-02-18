/* eslint-disable react/jsx-key */
import { useContext, useEffect, useState, useRef } from "react";

import Logo from "./Logo";
import { UserContext } from "./UserContext";
import { uniqBy } from "lodash";
import axios from "axios";
import Contact from "./Contact";

export default function Chat() {
  // eslint-disable-next-line no-unused-vars
  const [ws, setws] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [selectedUserId, setselectedUserId] = useState(null);
  // this newMessageText is filled when we fill the form
  const [newMessageText, setnewMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const { id, username, setId, setUsername } = useContext(UserContext);
  const divUnderMessages = useRef();
  const [offlinePeople, setOfflinePeople] = useState({});

  const onlinePeopleExcludingOurUser = { ...onlinePeople };
  delete onlinePeopleExcludingOurUser[id];

  const messagesWithoutDupes = uniqBy(messages, "_id");

  useEffect(() => {
    connectToWs();
  }, []);

  function connectToWs() {
    const ws = new WebSocket("ws://localhost:4000");
    setws(ws);
    ws.addEventListener("message", handleMessage);
    ws.addEventListener("close", () => {
      setTimeout(() => {
        console.log("Disconnected.Trying to reconnect!");
        connectToWs();
      }, 1000);
    });
  }

  function showMessageDataOnline(peopleArray) {
    const peopleObj = {};

    peopleArray.forEach(({ userId, username }) => {
      peopleObj[userId] = username;
    });
    setOnlinePeople(peopleObj);
  }

  function handleMessage(e) {
    const messageData = JSON.parse(e.data);
    //console.log({ e, messageData });
    if ("online" in messageData) {
      showMessageDataOnline(messageData.online);
    } else {
      setMessages((prev) => [...prev, { ...messageData }]);
    }
  }

  function sendMessage(e) {
    e.preventDefault();
    console.log("message is sent");
    ws.send(
      JSON.stringify({
        recipient: selectedUserId,
        text: newMessageText,
      })
    );
    setnewMessageText("");
    setMessages((prev) => [
      ...prev,
      {
        text: newMessageText,
        sender: id,
        recipient: selectedUserId,
        _id: Date.now(),
      },
    ]);
  }

  // this use effect is for pointing to the newly recieved
  //messaged, it uses useRef hook
  useEffect(() => {
    const div = divUnderMessages.current;
    if (div) div.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedUserId) {
      axios
        .get("http://localhost:4000/messages/" + selectedUserId)
        .then((res) => {
          setMessages(res.data);
        });
    }
  }, [selectedUserId]);

  // this use effect is for finding the offline people
  useEffect(() => {
    axios.get("http://localhost:4000/people").then((res) => {
      // filtering out the offline people, firt filter for removing self user
      // second filter for actual offline people
      const offlinePeopleArr = res.data
        .filter((p) => p._id !== id)
        .filter(
          (p) => !Object.keys(onlinePeople).includes(p._id) // includes to check if a value is present in an array or not.
        );
      // now we need to convert offline People Array to Object

      const offlinePeople = {};
      offlinePeopleArr.forEach((p) => {
        offlinePeople[p._id] = p;
      });
      setOfflinePeople(offlinePeople);

      console.log("onlinepeople");
      console.log(onlinePeopleExcludingOurUser);
      console.log("offlinePeople");
      console.log(offlinePeople);
    });
  }, [onlinePeople]);

  // this func is for logout of application
  function logout() {
    axios.post("http://localhost:4000/logout").then(() => {
      setws(null);
      setId(null);
      setUsername(null);
    });
  }

  return (
    <div className="flex h-screen">
      <div className="bg-white w-1/3 pt-4 flex-col relative">
        <div className="flex-grow">
          <Logo />
          {Object.keys(onlinePeopleExcludingOurUser).map((userId) => (
            <Contact
              id={userId}
              username={onlinePeopleExcludingOurUser[userId]}
              func={() => setselectedUserId(userId)}
              selected={userId == selectedUserId}
              online={true}
            />
          ))}

          {Object.keys(offlinePeople).map((userId) => (
            <Contact
              id={userId}
              username={offlinePeople[userId].username}
              func={() => setselectedUserId(userId)}
              selected={userId == selectedUserId}
              online={false}
            />
          ))}
        </div>
        <div className=" items-center text-center bottom-0  fixed p-2 m-2 flex bg-blue-300 border rounded-md justify-center">
          <span className="p-2 text-md text-gray-600 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
            {username}
          </span>
          <button
            onClick={logout}
            className="w-20 h-10 text-sm text-gray-600 bg-blue-100 border rounded-md ml-2"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="bg-blue-100 w-2/3 flex flex-col">
        {/* This is the div where messsages are displayed */}
        <div className="flex-grow">
          {!selectedUserId && (
            <div className="flex h-full items-center justify-center">
              <div className="text-gray-400 text-2xl">
                &larr; select a person to chat
              </div>
            </div>
          )}

          {!!selectedUserId && (
            <div className="relative h-full">
              <div className="overflow-y-auto absolute inset-0">
                {messagesWithoutDupes.map((m) => (
                  <div
                    key={m._id}
                    className={
                      "" + (m.sender === id ? "text-left" : "text-right")
                    }
                  >
                    <div
                      className={
                        "text-left inline-block p-2 m-2 rounded-lg text-sm " +
                        (m.sender === id
                          ? "bg-purple-300 text-gray-600"
                          : "bg-green-300 text-gray-600")
                      }
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                <div ref={divUnderMessages}></div>
              </div>
            </div>
          )}
        </div>

        {/* This is the text area for form and button*/}
        {!!selectedUserId && (
          <form className="flex gap-2 mb-2 " onSubmit={sendMessage}>
            <input
              value={newMessageText}
              onChange={(e) => {
                setnewMessageText(e.target.value);
              }}
              type="text"
              placeholder="Type your message here"
              className="bg-white flex-grow p-2 ml-2 rounded-sm focus:outline-none "
            />
            <button
              type="submit"
              className="bg-blue-500 p-2 text-white mr-2 rounded-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
