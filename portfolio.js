// FILTERS
const filterBtns = document.querySelectorAll(".filter-btn");
const cards = document.querySelectorAll(".portfolio-card");

filterBtns.forEach(btn=>{
  btn.onclick = ()=>{
    filterBtns.forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    const filter = btn.dataset.filter;

    cards.forEach(card=>{
      card.style.display =
        filter==="all" || card.dataset.category===filter
        ? "flex"
        : "none";
    });
  };
});

// SIDEBAR
const sidebar = document.getElementById("sidebar");
function openNav(){
  sidebar.classList.add("open");
}
function closeNav(){
  sidebar.classList.remove("open");
}

// YEAR
document.getElementById("year").textContent = new Date().getFullYear();