let date = new Date("2026-01-01T12:00:00");
const clock = document.getElementById("clock");
const timeout = setInterval(() => {
  let now = new Date();
  let diff = date.getTime() - now.getTime();
  let days = Math.floor(diff / (1000 * 60 * 60 * 24));
  let hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  let minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  let seconds = Math.floor((diff % (1000 * 60)) / 1000);
  let milliseconds = Math.floor(diff % 1000);
  clock.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s ${milliseconds}ms`;
}, 10);
