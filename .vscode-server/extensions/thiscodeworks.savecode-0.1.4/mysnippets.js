const vscode = acquireVsCodeApi();

//Select view
const selectElement = document.getElementById('view');
const listParent = document.getElementById("list-parent");
selectElement.addEventListener('change', (event) => {
        listParent.classList.toggle("gridview");
        listParent.classList.toggle("listview");
});

//Expand/collapse code block in list
var list = document.getElementById("list");
list.addEventListener("click", function (event) {
    var code = event.target.closest("li").querySelector("xmp").innerText;
    if (event.target.tagName.toLowerCase() === "xmp") { return }; //prevents close on clicking code
    if (event.target.classList.contains("copy")) { //click to copy function
        var emptyArea = document.createElement('TEXTAREA');
        emptyArea.innerHTML = code;
        const parentElement = document.getElementById('list');
        parentElement.appendChild(emptyArea);
        emptyArea.select();
        document.execCommand('copy');
        parentElement.removeChild(emptyArea);
        return
    }
    var pre = event.target.closest("li").querySelector(".code");
    if (pre != null) {
        pre.style.display = "block";
        event.target.closest("li").querySelector(".buttons").style.display = "block";
    };
});

//Refresh snippets
var refresh = document.getElementById("refresh");
refresh.addEventListener("click", function (){
    vscode.postMessage({
        command: 'refresh'
    })
})

//Show search bar
var search = document.getElementById("searchBar");
search.addEventListener("keypress", function (e){
    if (e.key === 'Enter') {
        document.getElementById("title").innerHTML = "Searching...";
        var query = search.value;
        if (query.length === 0){
            vscode.postMessage({
                command: 'refresh'
            })  
        } else {
            vscode.postMessage({
                command: 'search',
                text: query
            })
         }
        return
      }
})
