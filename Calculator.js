let screen = document.getElementById("text-area");
buttons = document.querySelectorAll(".btn");
function gay() {
 alert('You Are Gay! ๐')
}
let screenValue = "";
for (item of buttons) {
 item.addEventListener("click", (e) => {
  buttonText = e.target.innerText;
  if (buttonText == "ร") {
   buttonText = "*";
   screenValue += buttonText;
   screen.value = screenValue;
  }
  else if (buttonText == "รท") {
   buttonText = "/";
   screenValue += buttonText;
   screen.value = screenValue;
  }
   else if (buttonText == "C") {
   screenValue = "";
   screen.value = screenValue;
  } else if (buttonText == "=") {
   screen.value = eval(screenValue);
  } else {
   screenValue += buttonText;
   screen.value = screenValue;
  }
 });
}
