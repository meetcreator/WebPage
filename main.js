const sidebar = document.getElementById("sidebar");

function openNav(){
  sidebar.classList.add("open");
}
function closeNav(){
  sidebar.classList.remove("open");
}

document.getElementById("year").textContent = new Date().getFullYear();