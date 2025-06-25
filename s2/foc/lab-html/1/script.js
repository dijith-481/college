document.addEventListener("DOMContentLoaded", function () {
  // Alert when the page loads
  alert("Welcome to My Profile Page!");

  // Get references to the button and paragraph
  const changeTextBtn = document.getElementById("changeTextBtn");
  const dynamicText = document.getElementById("dynamicText");

  // Add event listener to the button to change paragraph text
  changeTextBtn.addEventListener("click", function () {
    dynamicText.textContent = "The text has been changed!";
  });

  // Get reference to the image
  const profileImage = document.getElementById("profile-image");
  const originalWidth = profileImage.offsetWidth;
  const originalHeight = profileImage.offsetHeight;

  // Add event listeners for hover effect on the image
  profileImage.addEventListener("mouseover", function () {
    profileImage.style.width = originalWidth * 1.2 + "px";
    profileImage.style.height = originalHeight * 1.2 + "px";
    profileImage.style.transition =
      "width 0.3s ease-in-out, height 0.3s ease-in-out"; // Add smooth transition
  });

  profileImage.addEventListener("mouseout", function () {
    profileImage.style.width = originalWidth + "px";
    profileImage.style.height = originalHeight + "px";
    profileImage.style.transition =
      "width 0.3s ease-in-out, height 0.3s ease-in-out"; // Add smooth transition
  });

  // Get references to the highlight button and paragraph
  const highlightBtn = document.getElementById("highlightBtn");
  const highlightParagraph = document.getElementById("highlightParagraph");

  // Add event listener to toggle the highlight class
  highlightBtn.addEventListener("click", function () {
    highlightParagraph.classList.toggle("highlight");
  });
});
