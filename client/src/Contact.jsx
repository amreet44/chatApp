/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */

import Avatar from "./Avatar";

export default function Contact({ id, username, func, selected, online }) {
  //console.log(username);
  return (
    <>
      <div
        key={id}
        onClick={() => func(id)}
        className={
          "flex border-b border-blue-100  items-center gap-2 cursor-pointer " +
          (selected ? "bg-blue-200" : "")
        }
      >
        {selected && <div className="w-1 bg-blue-500 h-12 rounded-r-md"></div>}
        <div className="flex gap-2 py-2 pl-2 items-center">
          <Avatar online={online} username={username} userId={id} />
          <span> {username}</span>
        </div>
      </div>
    </>
  );
}
