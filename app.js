// Firebase 연동
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCm9ocxNT4IflnRjDXC7SknegFauX0iIxo",
  authDomain: "song-homepage2.firebaseapp.com",
  databaseURL: "https://song-homepage2-default-rtdb.firebaseio.com",
  projectId: "song-homepage2",
  storageBucket: "song-homepage2.appspot.com",
  messagingSenderId: "772049031563",
  appId: "1:772049031563:web:bec6f81700c5e609689f8e",
  measurementId: "G-J1DPBKM3ZJ"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 비밀번호 검사
window.checkPassword = function() {
  const input = document.getElementById('passwordInput').value;
  if (input === "sik282") {
    document.getElementById('login').style.display = 'none';
    document.getElementById('main').style.display = 'block';
    document.getElementById('bgm').play();
  } else {
    alert("비밀번호가 틀렸습니다!");
  }
};

// 메뉴 전환
window.showPage = function(page) {
  document.getElementById('content').innerHTML = `<h2>${page.toUpperCase()} 메뉴 준비 중...</h2>`;
  if (page === "schedule") { loadSchedule(); }
  else if (page === "todo") { loadTodo(); }
  else if (page === "progress") { loadProgress(); }
  else if (page === "weight") { loadWeight(); }
  else if (page === "expense") { loadExpense(); }
  // diary, memo, habit, search 등은 이후 추가
};

// --- 일정 (Schedule) 기능 ---
function loadSchedule() {
  document.getElementById('content').innerHTML = `
    <div id="calendar"></div>
  `;

  const calendarEl = document.getElementById('calendar');
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'ko',
    timeZone: 'Asia/Seoul',
    events: [],
    selectable: true,
    select: function(info) {
      const title = prompt('일정 제목을 입력하세요');
      if (title) {
        calendar.addEvent({
          title: title,
          start: info.startStr,
          allDay: true
        });
        push(ref(db, 'schedule/'), { title, date: info.startStr });
      }
    }
  });

  onValue(ref(db, 'schedule/'), (snapshot) => {
    if (snapshot.exists()) {
      snapshot.forEach(child => {
        const data = child.val();
        calendar.addEvent({
          title: data.title,
          start: data.date,
          allDay: true
        });
      });
    }
  });

  calendar.render();
}

// --- 할 일 (TODO) 기능 ---
function loadTodo() {
  document.getElementById('content').innerHTML = `
    <input type="text" id="todoInput" placeholder="할 일을 입력하세요">
    <button onclick="addTodo()">추가</button>
    <ul id="todoList"></ul>
  `;

  onValue(ref(db, 'todo/'), (snapshot) => {
    if (snapshot.exists()) {
      document.getElementById('todoList').innerHTML = '';
      snapshot.forEach(child => {
        const data = child.val();
        const li = document.createElement('li');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = data.checked;
        checkbox.onclick = function() {
          if (checkbox.checked) {
            li.style.textDecoration = 'line-through';
          } else {
            li.style.textDecoration = 'none';
          }
        };
        if (data.checked) {
          li.style.textDecoration = 'line-through';
        }
        li.appendChild(checkbox);
        li.appendChild(document.createTextNode(' ' + data.task));
        document.getElementById('todoList').appendChild(li);
      });
    }
  });
}

window.addTodo = function() {
  const task = document.getElementById('todoInput').value;
  if (task) {
    push(ref(db, 'todo/'), { task, checked: false });
    document.getElementById('todoInput').value = '';
  }
};

// --- 진행률 (Progress) 기능 ---
function loadProgress() {
  document.getElementById('content').innerHTML = `
    <input type="text" id="goalInput" placeholder="목표를 입력하세요">
    <button onclick="addGoal()">목표 설정</button>
    <ul id="goalList"></ul>
    <div id="progressRate"></div>
  `;

  onValue(ref(db, 'progress/'), (snapshot) => {
    if (snapshot.exists()) {
      document.getElementById('goalList').innerHTML = '';
      let total = 0;
      let done = 0;
      snapshot.forEach(child => {
        const data = child.val();
        total++;
        const li = document.createElement('li');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = data.checked;
        checkbox.onclick = function() {
          if (checkbox.checked) {
            done++;
          } else {
            done--;
          }
          updateProgress(total, done);
        };
        if (data.checked) {
          done++;
        }
        li.appendChild(checkbox);
        li.appendChild(document.createTextNode(' ' + data.task));
        document.getElementById('goalList').appendChild(li);
      });
      updateProgress(total, done);
    }
  });
}

function updateProgress(total, done) {
  const percent = Math.round((done / total) * 100);
  document.getElementById('progressRate').innerText = `진행률: ${percent}%`;
}

window.addGoal = function() {
  const task = document.getElementById('goalInput').value;
  if (task) {
    push(ref(db, 'progress/'), { task, checked: false });
    document.getElementById('goalInput').value = '';
  }
};

// --- 체중 (Weight) + 그래프 기능 ---
function loadWeight() {
  document.getElementById('content').innerHTML = `
    <input type="date" id="weightDate">
    <input type="number" id="weightInput" placeholder="체중 입력(kg)">
    <button onclick="addWeight()">추가</button>
    <canvas id="weightChart" style="margin-top:20px;"></canvas>
  `;

  onValue(ref(db, 'weight/'), (snapshot) => {
    if (snapshot.exists()) {
      const labels = [];
      const data = [];
      snapshot.forEach(child => {
        labels.push(child.val().date);
        data.push(child.val().weight);
      });
      const ctx = document.getElementById('weightChart').getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: '체중 변화',
            data: data,
            borderColor: 'blue',
            backgroundColor: 'lightblue',
            fill: false
          }]
        }
      });
    }
  });
}

window.addWeight = function() {
  const date = document.getElementById('weightDate').value;
  const weight = document.getElementById('weightInput').value;
  if (date && weight) {
    push(ref(db, 'weight/'), { date, weight });
  }
};

// --- 가계부 (Expense) + 그래프 기능 ---
function loadExpense() {
  document.getElementById('content').innerHTML = `
    <input type="date" id="expenseDate">
    <input type="number" id="expenseAmount" placeholder="금액 입력">
    <select id="expenseCategory">
      <option>식비</option><option>쇼핑</option><option>외식</option><option>의료비</option><option>교통비</option><option>기타</option>
    </select>
    <select id="paymentMethod">
      <option>현대카드</option><option>삼성카드</option><option>신한카드</option><option>계좌이체</option><option>현금</option>
    </select>
    <button onclick="addExpense()">추가</button>
    <canvas id="categoryChart" style="margin-top:20px;"></canvas>
    <canvas id="paymentChart" style="margin-top:20px;"></canvas>
  `;

  onValue(ref(db, 'expense/'), (snapshot) => {
    if (snapshot.exists()) {
      const categoryData = {};
      const paymentData = {};
      snapshot.forEach(child => {
        const val = child.val();
        categoryData[val.category] = (categoryData[val.category] || 0) + Number(val.amount);
        paymentData[val.method] = (paymentData[val.method] || 0) + Number(val.amount);
      });

      const ctx1 = document.getElementById('categoryChart').getContext('2d');
      new Chart(ctx1, {
        type: 'pie',
        data: {
          labels: Object.keys(categoryData),
          datasets: [{
            label: '카테고리별 지출',
            data: Object.values(categoryData),
            backgroundColor: ['red', 'blue', 'green', 'purple', 'orange', 'gray']
          }]
        }
      });

      const ctx2 = document.getElementById('paymentChart').getContext('2d');
      new Chart(ctx2, {
        type: 'pie',
        data: {
          labels: Object.keys(paymentData),
          datasets: [{
            label: '결제수단별 지출',
            data: Object.values(paymentData),
            backgroundColor: ['cyan', 'magenta', 'yellow', 'pink', 'lightgreen']
          }]
        }
      });
    }
  });
}

window.addExpense = function() {
  const date = document.getElementById('expenseDate').value;
  const amount = document.getElementById('expenseAmount').value;
  const category = document.getElementById('expenseCategory').value;
  const method = document.getElementById('paymentMethod').value;
  if (date && amount) {
    push(ref(db, 'expense/'), { date, amount, category, method });
  }
};
