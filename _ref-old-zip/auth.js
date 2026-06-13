const ADMIN_PASS="1234";
document.getElementById("loginAdmin").onclick=()=>{const p=document.getElementById("pass").value.trim();if(p===ADMIN_PASS){sessionStorage.setItem("sufaraaAdmin","1");location.href="admin.html"}else alert("كلمة المرور غير صحيحة")};
document.getElementById("pass").addEventListener("keydown",e=>{if(e.key==="Enter")document.getElementById("loginAdmin").click()});
