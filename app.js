let posts = [], users = [], comments = []
let page = 1, limit = 10

const feed = document.getElementById("feed")
const search = document.getElementById("search")
const mode = document.getElementById("mode")
const long = document.getElementById("long")
const group = document.getElementById("group")
const sort = document.getElementById("sort")
const pageSpan = document.getElementById("page")
const modal = document.getElementById("modal")
const box = document.getElementById("box")

Promise.all([
    fetch("https://jsonplaceholder.typicode.com/posts").then(r => r.json()),
    fetch("https://jsonplaceholder.typicode.com/users").then(r => r.json()),
    fetch("https://jsonplaceholder.typicode.com/comments").then(r => r.json())
]).then(d => {
    posts = d[0]; users = d[1]; comments = d[2]
    draw()
})
const userName = id => users.find(u => u.id == id)?.name
const commentCount = id => comments.filter(c => c.postId == id).length
const debounce = (fn, d = 300) => {
    let t
    return (...a) => {
        clearTimeout(t)
        t = setTimeout(() => fn(...a), d)
    }
}
function applySearch(list) {
    let q = search.value.toLowerCase()
    if (!q) return list
    return list.filter(p => {
        let all = (p.title + p.body + userName(p.userId)).toLowerCase()

        if (mode.value == "title") return p.title.toLowerCase().includes(q)
        if (mode.value == "fuzzy") return q.split("").every(c => all.includes(c))
        return all.includes(q)
    })
}
function applyTransform(list) {
    let out = [...list]
    if (long.checked)
        out = out.map(p => ({ ...p, highlight: p.body.length > 120 }))
    if (sort.checked)
        out.sort((a, b) => commentCount(b.id) - commentCount(a.id))
    if (group.checked) {
        let g = {}
        out.forEach(p => (g[p.userId] ??= []).push(p))
        out = Object.entries(g).flatMap(([id, v]) => [
            { sep: userName(id) }, ...v
        ])
    }
    return out
}
function draw() {
    let list = applyTransform(applySearch(posts))
    let slice = list.slice((page - 1) * limit, page * limit)

    feed.innerHTML = ""
    if (!slice.length) {
        feed.innerHTML = "No results"
        return
    }
    slice.forEach(p => {
        if (p.sep) {
            feed.innerHTML += `<div class="separator">${p.sep}</div>`
            return
        }
        feed.innerHTML += `
<div class="post ${p.highlight ? "highlight" : ""}" onclick="openPost(${p.id})">
<b>${p.title}</b><br>
<small>${userName(p.userId)}</small>
<p>${p.body.slice(0, 80)}...</p>
</div>`
    })

    pageSpan.textContent = "Page " + page
}
function openPost(id) {
    let p = posts.find(x => x.id == id)
    let c = comments.filter(x => x.postId == id)

    box.innerHTML = `
<h3>${p.title}</h3>
<b>${userName(p.userId)}</b>
<p>${p.body}</p>
<h4>Comments</h4>
${c.map(x => `<p>${x.body}</p>`).join("")}
`

    modal.style.display = "flex"
}
modal.onclick = () => modal.style.display = "none"

search.oninput = debounce(() => { page = 1; draw() })
mode.onchange = draw
    ;[long, group, sort].forEach(x => x.onchange = draw)

prev.onclick = () => { if (page > 1) { page--; draw() } }
next.onclick = () => { page++; draw() }
