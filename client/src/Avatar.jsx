/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
export default function Avatar({ online, username, userId }) {
  const colors = [
    "bg-red-200",
    "bg-green-200",
    "bg-blue-600",
    "bg-yellow-200",
    "bg-teal-200",
    "bg-orange-200",
  ];
  //console.log("Online is" + typeof username);
  const userIdBase10 = parseInt(userId, 16);
  const colorIndex = userIdBase10 % colors.length;
  const color = colors[colorIndex];
  return (
    <div
      className={
        "w-8 h-8 rounded-full py-2 items-center justify-center relative " +
        color
      }
    >
      <div className="text-center relative bottom-1.5 opacity-70">
        {username[0]}
      </div>

      {!online && (
        <div className="absolute w-3 h-3 bg-gray-300 bottom-0 right-0 rounded-full border border-white"></div>
      )}
      {online && (
        <div className="absolute w-3 h-3 bg-green-500 bottom-0 right-0 rounded-full border border-white"></div>
      )}
    </div>
  );
}
