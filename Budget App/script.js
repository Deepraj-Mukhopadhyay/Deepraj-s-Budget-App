/* =========================================================
   PG FINANCE MANAGER
   COMPLETE JAVASCRIPT
========================================================= */


/* =========================================================
   1. CONFIGURATION
========================================================= */

const MEMBERS = [
    "Deepraj",
    "Anant",
    "Ravi",
    "Baijnath",
    "Kunal"
];

const STORAGE_KEY = "pgFinanceManager_v1";


/* =========================================================
   2. APPLICATION DATA
========================================================= */

let appData = {
    version: 1,

    members: [...MEMBERS],

    contributions: [],

    expenses: [],

    settlements: [],

    corrections: [],

    transactions: [],

    archivedMonths: []
};


/* =========================================================
   3. DOM HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);

const $$ = (selector) =>
    document.querySelectorAll(selector);


/* =========================================================
   4. STORAGE
========================================================= */

function saveData() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(appData)
    );
}


function loadData() {

    const savedData =
        localStorage.getItem(STORAGE_KEY);

    if (!savedData) {

        saveData();

        return;
    }

    try {

        const parsed =
            JSON.parse(savedData);

        appData = {
            ...appData,
            ...parsed
        };

    } catch (error) {

        console.error(
            "Could not load saved data:",
            error
        );

        showToast(
            "Saved data could not be loaded.",
            "error"
        );
    }
}


/* =========================================================
   5. ID GENERATOR
========================================================= */

function generateId(prefix = "TXN") {

    return (
        prefix +
        "-" +
        Date.now().toString(36).toUpperCase() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 7)
            .toUpperCase()
    );
}


/* =========================================================
   6. DATE / TIME HELPERS
========================================================= */

function getToday() {

    const date = new Date();

    const year =
        date.getFullYear();

    const month =
        String(date.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(date.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function getCurrentDateTime() {

    return new Date().toISOString();
}


function formatDate(dateString) {

    if (!dateString) return "-";

    const date =
        new Date(dateString + "T00:00:00");

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


function formatDateTime(dateString) {

    if (!dateString) return "-";

    const date =
        new Date(dateString);

    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


function formatCurrency(amount) {

    const value =
        Number(amount) || 0;

    return "₹" +
        value.toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
}


/* =========================================================
   7. GENERAL HELPERS
========================================================= */

function escapeHTML(value) {

    if (value === null ||
        value === undefined) {

        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function getInitials(name) {

    return name
        .split(" ")
        .map(part => part[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
}


function sum(values) {

    return values.reduce(
        (total, value) =>
            total + Number(value || 0),
        0
    );
}


function getCurrentMonth() {

    return getToday().substring(0, 7);
}


function isCurrentMonth(date) {

    return (
        date &&
        date.substring(0, 7) ===
        getCurrentMonth()
    );
}


/* =========================================================
   8. TRANSACTION ENGINE
========================================================= */

function addTransaction({
    type,
    description,
    amount,
    person = "",
    referenceId = "",
    date = getToday(),
    metadata = {}
}) {

    const transaction = {

        id: generateId("TXN"),

        timestamp:
            getCurrentDateTime(),

        date,

        type,

        description,

        amount:
            Number(amount) || 0,

        person,

        referenceId,

        metadata
    };

    appData.transactions.push(
        transaction
    );

    saveData();

    return transaction;
}


/* =========================================================
   9. NAVIGATION
========================================================= */

function navigateTo(sectionName) {

    $$(".page-section")
        .forEach(section => {

            section.classList.remove(
                "active"
            );
        });

    $$(".nav-item")
        .forEach(item => {

            item.classList.remove(
                "active"
            );

            if (
                item.dataset.section ===
                sectionName
            ) {

                item.classList.add(
                    "active"
                );
            }
        });


    const target =
        $(`${sectionName}-section`);

    if (target) {

        target.classList.add(
            "active"
        );
    }


    const titles = {

        dashboard: [
            "Dashboard",
            "Manage your PG finances"
        ],

        contributions: [
            "Contributions",
            "Track money added to the common fund"
        ],

        expenses: [
            "Daily Expenses",
            "Record and monitor room expenses"
        ],

        members: [
            "Members",
            "Financial overview of all five members"
        ],

        balances: [
            "Balances",
            "See who should pay and receive"
        ],

        settlement: [
            "Settlement",
            "Calculate who should pay whom"
        ],

        transactions: [
            "Transactions",
            "Complete permanent financial record"
        ],

        history: [
            "Daily History",
            "View financial activity by date"
        ],

        statistics: [
            "Statistics",
            "Analyze your PG spending"
        ],

        reports: [
            "Reports",
            "Generate monthly financial reports"
        ],

        settings: [
            "Settings",
            "Manage application and backups"
        ]
    };


    const title =
        titles[sectionName];

    if (title) {

        $("pageTitle").textContent =
            title[0];

        $("pageSubtitle").textContent =
            title[1];
    }


    if (
        window.innerWidth <= 700
    ) {

        $("sidebar")
            .classList.remove("open");
    }


    renderCurrentSection(
        sectionName
    );
}


function renderCurrentSection(section) {

    switch (section) {

        case "dashboard":
            renderDashboard();
            break;

        case "contributions":
            renderContributions();
            break;

        case "expenses":
            renderExpenses();
            break;

        case "members":
            renderMembers();
            break;

        case "balances":
            renderBalances();
            break;

        case "settlement":
            renderSettlement();
            break;

        case "transactions":
            renderTransactions();
            break;

        case "history":
            renderDailyHistory();
            break;

        case "statistics":
            renderStatistics();
            break;

        case "reports":
            renderReports();
            break;

        case "settings":
            renderSettings();
            break;
    }
}


/* =========================================================
   10. FINANCIAL CALCULATIONS
========================================================= */


/*
    Total money contributed to common fund.
*/

function getTotalContributions() {

    return sum(
        appData.contributions
            .filter(c => !c.reversed)
            .map(c => c.amount)
    );
}


/*
    Total expenses.

    Every expense can have different
    people sharing it.
*/

function getTotalExpenses() {

    return sum(
        appData.expenses
            .filter(e => !e.reversed)
            .map(e => e.amount)
    );
}


/*
    Common fund balance.

    Contributions
    - Expenses
    + Settlements coming into fund
*/

function getCommonFundBalance() {

    const contributions =
        getTotalContributions();

    const expenses =
        getTotalExpenses();

    return contributions - expenses;
}


/*
    Total amount each person actually paid
    for expenses.
*/

function getPaidByMember(member) {

    return sum(
        appData.expenses
            .filter(
                e =>
                    !e.reversed &&
                    e.paidBy === member
            )
            .map(e => e.amount)
    );
}


/*
    Total amount each person contributed
    to the common fund.
*/

function getContributionByMember(member) {

    return sum(
        appData.contributions
            .filter(
                c =>
                    !c.reversed &&
                    c.member === member
            )
            .map(c => c.amount)
    );
}


/*
    Calculate each person's share
    of all expenses.

    Example:

    ₹1000 expense
    shared by 5

    Each share = ₹200
*/

function getShareByMember(member) {

    let total = 0;

    appData.expenses
        .filter(e => !e.reversed)
        .forEach(expense => {

            if (
                expense.sharedBy &&
                expense.sharedBy.includes(member)
            ) {

                const people =
                    expense.sharedBy.length;

                total +=
                    expense.amount / people;
            }
        });

    return total;
}


/*
    IMPORTANT:

    Net balance is based on:

    Actual expense payment
    - Fair share

    Positive:
    Person paid more than their share.

    Negative:
    Person consumed more than they paid.
*/

function getNetBalance(member) {

    const paid =
        getPaidByMember(member);

    const share =
        getShareByMember(member);

    return paid - share;
}


/*
    Full balance object.
*/

function calculateBalances() {

    return MEMBERS.map(member => {

        const paid =
            getPaidByMember(member);

        const share =
            getShareByMember(member);

        const balance =
            paid - share;

        return {

            member,

            paid,

            share,

            balance
        };
    });
}


/* =========================================================
   11. SETTLEMENT ALGORITHM
========================================================= */


/*
    This algorithm finds who should pay whom.

    Example:

    A +800
    B +200
    C -300
    D -100
    E -600

    It creates the smallest practical
    set of transfers.
*/

function calculateSettlement() {

    const balances =
        calculateBalances();

    const creditors =
        balances
            .filter(b => b.balance > 0.009)
            .map(b => ({
                member: b.member,
                amount: b.balance
            }))
            .sort(
                (a, b) =>
                    b.amount - a.amount
            );


    const debtors =
        balances
            .filter(b => b.balance < -0.009)
            .map(b => ({
                member: b.member,
                amount: Math.abs(b.balance)
            }))
            .sort(
                (a, b) =>
                    b.amount - a.amount
            );


    const settlements = [];

    let i = 0;
    let j = 0;


    while (
        i < debtors.length &&
        j < creditors.length
    ) {

        const debtor =
            debtors[i];

        const creditor =
            creditors[j];


        const amount =
            Math.min(
                debtor.amount,
                creditor.amount
            );


        if (amount > 0.009) {

            settlements.push({

                id:
                    generateId("SET"),

                from:
                    debtor.member,

                to:
                    creditor.member,

                amount:
                    Number(
                        amount.toFixed(2)
                    ),

                createdAt:
                    getCurrentDateTime()
            });
        }


        debtor.amount -= amount;

        creditor.amount -= amount;


        if (
            Math.abs(debtor.amount)
            < 0.01
        ) {

            i++;
        }


        if (
            Math.abs(creditor.amount)
            < 0.01
        ) {

            j++;
        }
    }


    return settlements;
}


/* =========================================================
   12. ADD CONTRIBUTION
========================================================= */

function addContribution(event) {

    event.preventDefault();


    const member =
        $("contributionMember").value;

    const amount =
        Number(
            $("contributionAmount").value
        );

    const date =
        $("contributionDate").value;

    const paymentMethod =
        $("contributionPaymentMethod").value;

    const note =
        $("contributionNote").value.trim();


    if (!member) {

        showToast(
            "Please select a member.",
            "error"
        );

        return;
    }


    if (!amount || amount <= 0) {

        showToast(
            "Enter a valid amount.",
            "error"
        );

        return;
    }


    if (!date) {

        showToast(
            "Please select a date.",
            "error"
        );

        return;
    }


    const contribution = {

        id:
            generateId("CON"),

        member,

        amount:
            Number(amount.toFixed(2)),

        date,

        paymentMethod,

        note,

        createdAt:
            getCurrentDateTime(),

        reversed: false
    };


    appData.contributions.push(
        contribution
    );


    addTransaction({

        type: "contribution",

        description:
            `Contribution by ${member}`,

        amount,

        person: member,

        referenceId:
            contribution.id,

        date,

        metadata: {
            paymentMethod,
            note
        }
    });


    saveData();


    $("contributionForm")
        .reset();


    setDefaultDates();

    closeModal(
        "contributionModal"
    );


    showToast(
        `${formatCurrency(amount)} added for ${member}.`,
        "success"
    );


    refreshAll();
}


/* =========================================================
   13. ADD EXPENSE
========================================================= */

function addExpense(event) {

    event.preventDefault();


    const item =
        $("expenseItem").value.trim();

    const amount =
        Number(
            $("expenseAmount").value
        );

    const category =
        $("expenseCategory").value;

    const paidBy =
        $("expensePaidBy").value;

    const date =
        $("expenseDate").value;

    const note =
        $("expenseNote").value.trim();


    const checkboxes =
        document.querySelectorAll(
            'input[name="expenseShare"]:checked'
        );


    const sharedBy =
        Array.from(checkboxes)
            .map(
                checkbox =>
                    checkbox.value
            );


    if (!item) {

        showToast(
            "Enter an expense description.",
            "error"
        );

        return;
    }


    if (!amount || amount <= 0) {

        showToast(
            "Enter a valid expense amount.",
            "error"
        );

        return;
    }


    if (!category) {

        showToast(
            "Select an expense category.",
            "error"
        );

        return;
    }


    if (!paidBy) {

        showToast(
            "Select who paid.",
            "error"
        );

        return;
    }


    if (!date) {

        showToast(
            "Select the expense date.",
            "error"
        );

        return;
    }


    if (sharedBy.length === 0) {

        showToast(
            "Select at least one person who shares this expense.",
            "error"
        );

        return;
    }


    const expense = {

        id:
            generateId("EXP"),

        item,

        amount:
            Number(amount.toFixed(2)),

        category,

        paidBy,

        sharedBy,

        date,

        note,

        createdAt:
            getCurrentDateTime(),

        reversed: false
    };


    appData.expenses.push(
        expense
    );


    addTransaction({

        type: "expense",

        description:
            item,

        amount,

        person:
            paidBy,

        referenceId:
            expense.id,

        date,

        metadata: {

            category,

            paidBy,

            sharedBy,

            note
        }
    });


    saveData();


    $("expenseForm")
        .reset();


    setAllMemberCheckboxes(
        true
    );


    setDefaultDates();


    closeModal(
        "expenseModal"
    );


    showToast(
        `${formatCurrency(amount)} expense recorded.`,
        "success"
    );


    refreshAll();
}


/* =========================================================
   14. MEMBER CHECKBOXES
========================================================= */

function setAllMemberCheckboxes(
    checked
) {

    document
        .querySelectorAll(
            'input[name="expenseShare"]'
        )
        .forEach(
            checkbox =>
                checkbox.checked =
                checked
        );
}


function updateExpenseSharePreview() {

    const amount =
        Number(
            $("expenseAmount")?.value
        ) || 0;


    const selected =
        document.querySelectorAll(
            'input[name="expenseShare"]:checked'
        ).length;


    const share =
        selected > 0
            ? amount / selected
            : 0;


    if ($("expenseSharePreview")) {

        $("expenseSharePreview")
            .textContent =
            formatCurrency(share);
    }
}


/* =========================================================
   15. DASHBOARD
========================================================= */

function renderDashboard() {

    const contributions =
        getTotalContributions();

    const expenses =
        getTotalExpenses();

    const fund =
        getCommonFundBalance();


    const balances =
        calculateBalances();


    const pending =
        sum(
            balances
                .filter(
                    b =>
                        b.balance < 0
                )
                .map(
                    b =>
                        Math.abs(
                            b.balance
                        )
                )
        );


    $("dashboardFund")
        .textContent =
        formatCurrency(fund);


    $("dashboardContributions")
        .textContent =
        formatCurrency(
            sum(
                appData.contributions
                    .filter(
                        c =>
                            !c.reversed &&
                            isCurrentMonth(
                                c.date
                            )
                    )
                    .map(c => c.amount)
            )
        );


    $("dashboardExpenses")
        .textContent =
        formatCurrency(
            sum(
                appData.expenses
                    .filter(
                        e =>
                            !e.reversed &&
                            isCurrentMonth(
                                e.date
                            )
                    )
                    .map(e => e.amount)
            )
        );


    $("dashboardPending")
        .textContent =
        formatCurrency(pending);


    renderDashboardTransactions();

    renderDashboardBalances();
}


/* =========================================================
   16. DASHBOARD TRANSACTIONS
========================================================= */

function renderDashboardTransactions() {

    const container =
        $("dashboardTransactions");


    if (!container) return;


    const transactions =
        [...appData.transactions]
            .sort(
                (a, b) =>
                    new Date(b.timestamp) -
                    new Date(a.timestamp)
            )
            .slice(0, 7);


    if (transactions.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div>📜</div>

                <h3>No transactions yet</h3>

                <p>
                    Your transactions will appear here.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        transactions
            .map(transaction => {

                const isIncome =
                    transaction.type ===
                    "contribution";


                const icon =
                    isIncome
                        ? "💰"
                        : transaction.type ===
                          "expense"
                            ? "🛒"
                            : "🔄";


                const amountPrefix =
                    isIncome
                        ? "+"
                        : "-";


                return `

                    <div class="transaction-item">

                        <div class="transaction-icon">
                            ${icon}
                        </div>

                        <div class="transaction-info">

                            <strong>
                                ${escapeHTML(
                                    transaction.description
                                )}
                            </strong>

                            <span>
                                ${formatDate(
                                    transaction.date
                                )}
                                ·
                                ${escapeHTML(
                                    transaction.person
                                )}
                            </span>

                        </div>

                        <div
                            class="transaction-amount
                            ${isIncome
                                ? "income"
                                : "expense"}">

                            ${amountPrefix}
                            ${formatCurrency(
                                transaction.amount
                            )}

                        </div>

                    </div>

                `;
            })
            .join("");
}


/* =========================================================
   17. DASHBOARD BALANCES
========================================================= */

function renderDashboardBalances() {

    const container =
        $("dashboardBalances");


    if (!container) return;


    const balances =
        calculateBalances();


    container.innerHTML =
        balances
            .map(balance => {

                const cls =
                    balance.balance > 0.009
                        ? "positive"
                        : balance.balance < -0.009
                            ? "negative"
                            : "zero";


                const sign =
                    balance.balance > 0.009
                        ? "+"
                        : "";


                return `

                    <div class="member-balance-item">

                        <div class="member-avatar">
                            ${getInitials(
                                balance.member
                            )}
                        </div>

                        <div class="member-name">
                            ${escapeHTML(
                                balance.member
                            )}
                        </div>

                        <div
                            class="balance-value ${cls}">

                            ${sign}
                            ${formatCurrency(
                                balance.balance
                            )}

                        </div>

                    </div>

                `;
            })
            .join("");
}


/* =========================================================
   18. CONTRIBUTION PAGE
========================================================= */

function renderContributions() {

    const all =
        appData.contributions
            .filter(c => !c.reversed);


    const total =
        sum(
            all.map(c => c.amount)
        );


    const monthTotal =
        sum(
            all
                .filter(
                    c =>
                        isCurrentMonth(
                            c.date
                        )
                )
                .map(c => c.amount)
        );


    $("contributionTotal")
        .textContent =
        formatCurrency(total);


    $("contributionMonthTotal")
        .textContent =
        formatCurrency(monthTotal);


    renderContributionTable();
}


function renderContributionTable() {

    const tbody =
        $("contributionTableBody");


    if (!tbody) return;


    let data =
        appData.contributions
            .filter(c => !c.reversed);


    const filter =
        $("contributionMemberFilter")
            ?.value || "all";


    if (filter !== "all") {

        data =
            data.filter(
                c =>
                    c.member === filter
            );
    }


    data.sort(
        (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
    );


    if (data.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="text-align:center;
                    padding:35px;">

                    No contributions recorded.

                </td>

            </tr>

        `;

        return;
    }


    tbody.innerHTML =
        data
            .map(c => `

                <tr>

                    <td>
                        ${formatDate(c.date)}
                    </td>

                    <td>
                        <strong>
                            ${escapeHTML(c.member)}
                        </strong>
                    </td>

                    <td class="amount-positive">
                        +${formatCurrency(c.amount)}
                    </td>

                    <td>
                        ${escapeHTML(
                            c.paymentMethod
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            c.note || "-"
                        )}
                    </td>

                    <td>
                        <span class="badge badge-success">
                            Recorded
                        </span>
                    </td>

                </tr>

            `)
            .join("");
}


/* =========================================================
   19. EXPENSE PAGE
========================================================= */

function renderExpenses() {

    const all =
        appData.expenses
            .filter(e => !e.reversed);


    const total =
        sum(
            all.map(e => e.amount)
        );


    const monthTotal =
        sum(
            all
                .filter(
                    e =>
                        isCurrentMonth(
                            e.date
                        )
                )
                .map(e => e.amount)
        );


    $("expenseTotal")
        .textContent =
        formatCurrency(total);


    $("expenseMonthTotal")
        .textContent =
        formatCurrency(monthTotal);


    renderExpenseTable();
}


function renderExpenseTable() {

    const tbody =
        $("expenseTableBody");


    if (!tbody) return;


    let data =
        appData.expenses
            .filter(e => !e.reversed);


    const filter =
        $("expenseCategoryFilter")
            ?.value || "all";


    if (filter !== "all") {

        data =
            data.filter(
                e =>
                    e.category === filter
            );
    }


    data.sort(
        (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
    );


    if (data.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    style="text-align:center;
                    padding:35px;">

                    No expenses recorded.

                </td>

            </tr>

        `;

        return;
    }


    tbody.innerHTML =
        data
            .map(e => `

                <tr>

                    <td>
                        ${formatDate(e.date)}
                    </td>

                    <td>
                        <strong>
                            ${escapeHTML(e.item)}
                        </strong>
                    </td>

                    <td>
                        <span class="badge badge-blue">
                            ${escapeHTML(
                                e.category
                            )}
                        </span>
                    </td>

                    <td class="amount-negative">
                        -${formatCurrency(e.amount)}
                    </td>

                    <td>
                        ${escapeHTML(e.paidBy)}
                    </td>

                    <td>
                        ${e.sharedBy.length}
                        people
                    </td>

                    <td>

                        <button
                            class="text-button"
                            data-view-expense="${e.id}">

                            View

                        </button>

                    </td>

                </tr>

            `)
            .join("");
}


/* =========================================================
   20. MEMBERS PAGE
========================================================= */

function renderMembers() {

    const container =
        $("membersGrid");


    if (!container) return;


    container.innerHTML =
        MEMBERS
            .map(member => {

                const contribution =
                    getContributionByMember(
                        member
                    );

                const paid =
                    getPaidByMember(
                        member
                    );

                const share =
                    getShareByMember(
                        member
                    );

                const balance =
                    paid - share;


                const balanceClass =
                    balance > 0.009
                        ? "amount-positive"
                        : balance < -0.009
                            ? "amount-negative"
                            : "";


                return `

                    <div class="member-card">

                        <div class="member-card-avatar">
                            ${getInitials(member)}
                        </div>

                        <h3>
                            ${escapeHTML(member)}
                        </h3>

                        <div class="member-stat">

                            <span>
                                Contributions
                            </span>

                            <strong>
                                ${formatCurrency(
                                    contribution
                                )}
                            </strong>

                        </div>


                        <div class="member-stat">

                            <span>
                                Expenses Paid
                            </span>

                            <strong>
                                ${formatCurrency(
                                    paid
                                )}
                            </strong>

                        </div>


                        <div class="member-stat">

                            <span>
                                Fair Share
                            </span>

                            <strong>
                                ${formatCurrency(
                                    share
                                )}
                            </strong>

                        </div>


                        <div class="member-stat">

                            <span>
                                Net Balance
                            </span>

                            <strong class="${balanceClass}">

                                ${balance >= 0
                                    ? "+"
                                    : ""}

                                ${formatCurrency(
                                    balance
                                )}

                            </strong>

                        </div>

                    </div>

                `;
            })
            .join("");
}


/* =========================================================
   21. BALANCES PAGE
========================================================= */

function renderBalances() {

    const balances =
        calculateBalances();


    const totalReceive =
        sum(
            balances
                .filter(
                    b =>
                        b.balance > 0
                )
                .map(
                    b =>
                        b.balance
                )
        );


    const totalPay =
        sum(
            balances
                .filter(
                    b =>
                        b.balance < 0
                )
                .map(
                    b =>
                        Math.abs(
                            b.balance
                        )
                )
        );


    $("totalToReceive")
        .textContent =
        formatCurrency(totalReceive);


    $("totalToPay")
        .textContent =
        formatCurrency(totalPay);


    const container =
        $("balanceDetailList");


    if (!container) return;


    container.innerHTML =
        balances
            .map(b => {

                const status =
                    b.balance > 0.009
                        ? "Should Receive"
                        : b.balance < -0.009
                            ? "Needs to Pay"
                            : "Settled";


                const badge =
                    b.balance > 0.009
                        ? "badge-success"
                        : b.balance < -0.009
                            ? "badge-danger"
                            : "badge-gray";


                return `

                    <div class="balance-detail-item">

                        <div class="balance-person">

                            <div class="member-avatar">
                                ${getInitials(
                                    b.member
                                )}
                            </div>

                            <strong>
                                ${escapeHTML(
                                    b.member
                                )}
                            </strong>

                        </div>


                        <div class="balance-metric">

                            <span>
                                Paid
                            </span>

                            <strong>
                                ${formatCurrency(
                                    b.paid
                                )}
                            </strong>

                        </div>


                        <div class="balance-metric">

                            <span>
                                Fair Share
                            </span>

                            <strong>
                                ${formatCurrency(
                                    b.share
                                )}
                            </strong>

                        </div>


                        <div class="balance-metric">

                            <span>
                                Net Balance
                            </span>

                            <strong>

                                ${b.balance >= 0
                                    ? "+"
                                    : ""}

                                ${formatCurrency(
                                    b.balance
                                )}

                            </strong>

                        </div>


                        <div>

                            <span class="badge ${badge}">
                                ${status}
                            </span>

                        </div>

                    </div>

                `;
            })
            .join("");
}


/* =========================================================
   22. SETTLEMENT PAGE
========================================================= */

function renderSettlement() {

    const container =
        $("settlementList");


    if (!container) return;


    const settlements =
        calculateSettlement();


    if (settlements.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div>✅</div>

                <h3>
                    Everyone is settled
                </h3>

                <p>
                    No payments are currently required.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        settlements
            .map(s => `

                <div class="settlement-item">

                    <div class="settlement-people">

                        <span>
                            ${escapeHTML(s.from)}
                        </span>

                        <span class="settlement-arrow">
                            →
                        </span>

                        <span>
                            ${escapeHTML(s.to)}
                        </span>

                    </div>

                    <div class="settlement-amount">

                        ${formatCurrency(
                            s.amount
                        )}

                    </div>

                </div>

            `)
            .join("");
}


/* =========================================================
   23. TRANSACTIONS PAGE
========================================================= */

function renderTransactions() {

    const tbody =
        $("transactionTableBody");


    if (!tbody) return;


    let transactions =
        [...appData.transactions];


    const filter =
        $("transactionTypeFilter")
            ?.value || "all";


    if (filter !== "all") {

        transactions =
            transactions.filter(
                t =>
                    t.type === filter
            );
    }


    transactions.sort(
        (a, b) =>
            new Date(b.timestamp) -
            new Date(a.timestamp)
    );


    if (transactions.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="text-align:center;
                    padding:35px;">

                    No transactions recorded.

                </td>

            </tr>

        `;

        return;
    }


    tbody.innerHTML =
        transactions
            .map(t => {

                const typeLabel = {

                    contribution:
                        "Contribution",

                    expense:
                        "Expense",

                    settlement:
                        "Settlement",

                    correction:
                        "Correction"

                }[t.type] || t.type;


                const badgeClass = {

                    contribution:
                        "badge-success",

                    expense:
                        "badge-danger",

                    settlement:
                        "badge-blue",

                    correction:
                        "badge-warning"

                }[t.type] ||
                "badge-gray";


                return `

                    <tr
                        data-transaction-id="${t.id}"
                        style="cursor:pointer;">

                        <td>
                            ${formatDateTime(
                                t.timestamp
                            )}
                        </td>

                        <td>

                            <span
                                class="badge ${badgeClass}">

                                ${typeLabel}

                            </span>

                        </td>

                        <td>
                            ${escapeHTML(
                                t.description
                            )}
                        </td>

                        <td>
                            ${formatCurrency(
                                t.amount
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                t.person || "-"
                            )}
                        </td>

                        <td>
                            <small>
                                ${escapeHTML(
                                    t.id
                                )}
                            </small>
                        </td>

                    </tr>

                `;
            })
            .join("");
}


/* =========================================================
   24. DAILY HISTORY
========================================================= */

function renderDailyHistory() {

    const container =
        $("dailyHistory");


    if (!container) return;


    const selectedDate =
        $("historyDate").value ||
        getToday();


    const transactions =
        appData.transactions
            .filter(
                t =>
                    t.date === selectedDate
            )
            .sort(
                (a, b) =>
                    new Date(a.timestamp) -
                    new Date(b.timestamp)
            );


    if (transactions.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div>📅</div>

                <h3>
                    No activity on this date
                </h3>

                <p>
                    There are no financial transactions
                    recorded for ${formatDate(
                        selectedDate
                    )}.
                </p>

            </div>

        `;

        return;
    }


    const totalAmount =
        sum(
            transactions.map(
                t =>
                    t.amount
            )
        );


    container.innerHTML = `

        <div class="history-day">

            <div class="history-date-header">

                <strong>
                    ${formatDate(selectedDate)}
                </strong>

                <span>
                    ${transactions.length}
                    transaction(s)
                </span>

            </div>


            ${transactions
                .map(t => `

                    <div class="history-entry">

                        <div class="history-time">

                            ${new Date(
                                t.timestamp
                            ).toLocaleTimeString(
                                "en-IN",
                                {
                                    hour:
                                        "2-digit",
                                    minute:
                                        "2-digit"
                                }
                            )}

                        </div>


                        <div
                            class="transaction-icon">

                            ${
                                t.type ===
                                "contribution"
                                    ? "💰"
                                    : t.type ===
                                      "expense"
                                        ? "🛒"
                                        : "🔄"
                            }

                        </div>


                        <div
                            class="history-entry-content">

                            <strong>
                                ${escapeHTML(
                                    t.description
                                )}
                            </strong>

                            <span>

                                ${
                                    t.type
                                }

                                ·

                                ${
                                    escapeHTML(
                                        t.person || ""
                                    )
                                }

                                ·

                                ${formatCurrency(
                                    t.amount
                                )}

                            </span>

                        </div>

                    </div>

                `)
                .join("")}

        </div>

    `;
}


/* =========================================================
   25. STATISTICS
========================================================= */

function renderStatistics() {

    const expenses =
        appData.expenses
            .filter(e => !e.reversed);


    const total =
        sum(
            expenses.map(e => e.amount)
        );


    const transactionCount =
        appData.transactions.length;


    let averageDaily = 0;


    if (expenses.length > 0) {

        const uniqueDays =
            new Set(
                expenses.map(
                    e => e.date
                )
            ).size;


        averageDaily =
            uniqueDays > 0
                ? total / uniqueDays
                : 0;
    }


    const highest =
        expenses.length > 0
            ? Math.max(
                ...expenses.map(
                    e => e.amount
                )
            )
            : 0;


    $("statTotalSpending")
        .textContent =
        formatCurrency(total);


    $("statAverageDaily")
        .textContent =
        formatCurrency(
            averageDaily
        );


    $("statHighestExpense")
        .textContent =
        formatCurrency(highest);


    $("statTransactionCount")
        .textContent =
        transactionCount;


    renderCategoryStatistics();

    renderMemberStatistics();
}


/* =========================================================
   26. CATEGORY STATISTICS
========================================================= */

function renderCategoryStatistics() {

    const container =
        $("categoryStatistics");


    if (!container) return;


    const categoryTotals = {};


    appData.expenses
        .filter(e => !e.reversed)
        .forEach(e => {

            if (
                !categoryTotals[e.category]
            ) {

                categoryTotals[
                    e.category
                ] = 0;
            }


            categoryTotals[
                e.category
            ] += e.amount;
        });


    const entries =
        Object.entries(
            categoryTotals
        ).sort(
            (a, b) =>
                b[1] - a[1]
        );


    const total =
        sum(
            entries.map(
                entry =>
                    entry[1]
            )
        );


    if (entries.length === 0) {

        container.innerHTML = `

            <div class="empty-state">
                No category data yet.
            </div>

        `;

        return;
    }


    container.innerHTML =
        entries
            .map(
                ([category, amount]) => {

                    const percentage =
                        total > 0
                            ? (
                                amount /
                                total
                            ) * 100
                            : 0;


                    return `

                        <div class="stat-row">

                            <div
                                class="stat-row-label">

                                ${escapeHTML(
                                    category
                                )}

                            </div>

                            <div
                                class="stat-progress">

                                <div
                                    class="stat-progress-bar"
                                    style="width:${percentage}%">

                                </div>

                            </div>

                            <div
                                class="stat-row-value">

                                ${formatCurrency(
                                    amount
                                )}

                            </div>

                        </div>

                    `;
                }
            )
            .join("");
}


/* =========================================================
   27. MEMBER STATISTICS
========================================================= */

function renderMemberStatistics() {

    const container =
        $("memberStatistics");


    if (!container) return;


    const totals =
        MEMBERS.map(member => ({

            member,

            amount:
                getPaidByMember(
                    member
                )

        }))
        .sort(
            (a, b) =>
                b.amount - a.amount
        );


    const maximum =
        Math.max(
            ...totals.map(
                x => x.amount
            ),
            1
        );


    container.innerHTML =
        totals
            .map(item => {

                const percentage =
                    (
                        item.amount /
                        maximum
                    ) * 100;


                return `

                    <div class="stat-row">

                        <div
                            class="stat-row-label">

                            ${escapeHTML(
                                item.member
                            )}

                        </div>

                        <div
                            class="stat-progress">

                            <div
                                class="stat-progress-bar"
                                style="width:${percentage}%">

                            </div>

                        </div>

                        <div
                            class="stat-row-value">

                            ${formatCurrency(
                                item.amount
                            )}

                        </div>

                    </div>

                `;
            })
            .join("");
}


/* =========================================================
   28. REPORTS
========================================================= */

function renderReports() {

    const container =
        $("reportContainer");


    if (!container) return;


    const month =
        $("reportMonth")?.value;


    if (!month) {

        container.innerHTML = `

            <div class="empty-state">

                <div>📈</div>

                <h3>
                    No report generated
                </h3>

                <p>
                    Select a month and generate a report.
                </p>

            </div>

        `;

        return;
    }


    generateMonthlyReport(
        month
    );
}


function generateMonthlyReport(month) {

    const container =
        $("reportContainer");


    const contributions =
        appData.contributions
            .filter(
                c =>
                    !c.reversed &&
                    c.date.startsWith(month)
            );


    const expenses =
        appData.expenses
            .filter(
                e =>
                    !e.reversed &&
                    e.date.startsWith(month)
            );


    const totalContributions =
        sum(
            contributions.map(
                c => c.amount
            )
        );


    const totalExpenses =
        sum(
            expenses.map(
                e => e.amount
            )
        );


    const balance =
        totalContributions -
        totalExpenses;


    const days =
        new Set(
            expenses.map(
                e => e.date
            )
        ).size;


    const average =
        days > 0
            ? totalExpenses / days
            : 0;


    const categoryTotals = {};


    expenses.forEach(e => {

        categoryTotals[e.category] =
            (
                categoryTotals[
                    e.category
                ] || 0
            ) + e.amount;
    });


    const memberPaid =
        MEMBERS.map(member => ({

            member,

            amount:
                sum(
                    expenses
                        .filter(
                            e =>
                                e.paidBy ===
                                member
                        )
                        .map(
                            e =>
                                e.amount
                        )
                )

        }));


    const dateObject =
        new Date(
            month + "-01T00:00:00"
        );


    const monthName =
        dateObject.toLocaleDateString(
            "en-IN",
            {
                month: "long",
                year: "numeric"
            }
        );


    container.innerHTML = `

        <div class="report-card">

            <div class="report-title">

                <h3>
                    PG Finance Report
                </h3>

                <span>
                    ${monthName}
                </span>

            </div>


            <div class="report-summary">

                <div
                    class="report-summary-item">

                    <span>
                        Contributions
                    </span>

                    <strong>
                        ${formatCurrency(
                            totalContributions
                        )}
                    </strong>

                </div>


                <div
                    class="report-summary-item">

                    <span>
                        Expenses
                    </span>

                    <strong>
                        ${formatCurrency(
                            totalExpenses
                        )}
                    </strong>

                </div>


                <div
                    class="report-summary-item">

                    <span>
                        Balance
                    </span>

                    <strong>
                        ${formatCurrency(
                            balance
                        )}
                    </strong>

                </div>


                <div
                    class="report-summary-item">

                    <span>
                        Average Daily
                    </span>

                    <strong>
                        ${formatCurrency(
                            average
                        )}
                    </strong>

                </div>

            </div>

        </div>


        <div class="report-card">

            <div class="report-title">

                <h3>
                    Spending by Category
                </h3>

            </div>


            ${Object.entries(
                categoryTotals
            )
            .sort(
                (a, b) =>
                    b[1] - a[1]
            )
            .map(
                ([category, amount]) => `

                    <div class="stat-row">

                        <div
                            class="stat-row-label">

                            ${escapeHTML(
                                category
                            )}

                        </div>

                        <div
                            class="stat-row-value">

                            ${formatCurrency(
                                amount
                            )}

                        </div>

                    </div>

                `
            )
            .join("")}

        </div>


        <div class="report-card">

            <div class="report-title">

                <h3>
                    Amount Paid by Member
                </h3>

            </div>


            ${memberPaid
                .map(
                    item => `

                        <div class="stat-row">

                            <div
                                class="stat-row-label">

                                ${escapeHTML(
                                    item.member
                                )}

                            </div>

                            <div
                                class="stat-row-value">

                                ${formatCurrency(
                                    item.amount
                                )}

                            </div>

                        </div>

                    `
                )
                .join("")}

        </div>

    `;
}


/* =========================================================
   29. SETTINGS
========================================================= */

function renderSettings() {

    const container =
        $("settingsMembers");


    if (!container) return;


    container.innerHTML =
        MEMBERS
            .map(
                member => `

                    <div
                        class="settings-member">

                        👤
                        ${escapeHTML(
                            member
                        )}

                    </div>

                `
            )
            .join("");
}


/* =========================================================
   30. MODALS
========================================================= */

function openModal(id) {

    const modal =
        $(id);


    if (!modal) return;


    modal.classList.add(
        "active"
    );

    document.body.style.overflow =
        "hidden";
}


function closeModal(id) {

    const modal =
        $(id);


    if (!modal) return;


    modal.classList.remove(
        "active"
    );


    const activeModals =
        document.querySelectorAll(
            ".modal-overlay.active"
        );


    if (activeModals.length === 0) {

        document.body.style.overflow =
            "";
    }
}


/* =========================================================
   31. TOAST
========================================================= */

function showToast(
    message,
    type = "success"
) {

    const container =
        $("toastContainer");


    if (!container) return;


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `toast ${type}`;


    const icon =
        type === "success"
            ? "✓"
            : type === "error"
                ? "✕"
                : "⚠";


    toast.innerHTML = `

        <strong>
            ${icon}
        </strong>

        <span>
            ${escapeHTML(message)}
        </span>

    `;


    container.appendChild(
        toast
    );


    setTimeout(() => {

        toast.remove();

    }, 4200);
}


/* =========================================================
   32. DEFAULT DATES
========================================================= */

function setDefaultDates() {

    if ($("contributionDate")) {

        $("contributionDate").value =
            getToday();
    }


    if ($("expenseDate")) {

        $("expenseDate").value =
            getToday();
    }


    if ($("historyDate")) {

        $("historyDate").value =
            getToday();
    }


    if ($("reportMonth")) {

        $("reportMonth").value =
            getCurrentMonth();
    }
}


/* =========================================================
   33. TRANSACTION DETAILS
========================================================= */

function showTransactionDetails(
    transactionId
) {

    const transaction =
        appData.transactions.find(
            t =>
                t.id === transactionId
        );


    if (!transaction) {

        showToast(
            "Transaction not found.",
            "error"
        );

        return;
    }


    const container =
        $("transactionDetailsContent");


    container.innerHTML = `

        <div class="detail-row">

            <span>
                Transaction ID
            </span>

            <strong>
                ${escapeHTML(
                    transaction.id
                )}
            </strong>

        </div>


        <div class="detail-row">

            <span>
                Type
            </span>

            <strong>
                ${escapeHTML(
                    transaction.type
                )}
            </strong>

        </div>


        <div class="detail-row">

            <span>
                Description
            </span>

            <strong>
                ${escapeHTML(
                    transaction.description
                )}
            </strong>

        </div>


        <div class="detail-row">

            <span>
                Amount
            </span>

            <strong>
                ${formatCurrency(
                    transaction.amount
                )}
            </strong>

        </div>


        <div class="detail-row">

            <span>
                Person
            </span>

            <strong>
                ${escapeHTML(
                    transaction.person || "-"
                )}
            </strong>

        </div>


        <div class="detail-row">

            <span>
                Date
            </span>

            <strong>
                ${formatDate(
                    transaction.date
                )}
            </strong>

        </div>


        <div class="detail-row">

            <span>
                Recorded At
            </span>

            <strong>
                ${formatDateTime(
                    transaction.timestamp
                )}
            </strong>

        </div>


        <div class="detail-row">

            <span>
                Reference
            </span>

            <strong>
                ${escapeHTML(
                    transaction.referenceId ||
                    "-"
                )}
            </strong>

        </div>

    `;


    openModal(
        "transactionDetailsModal"
    );
}


/* =========================================================
   34. EXPORT DATA
========================================================= */

function exportData() {

    const backup = {

        exportedAt:
            getCurrentDateTime(),

        application:
            "PG Finance Manager",

        version:
            appData.version,

        data:
            appData
    };


    const json =
        JSON.stringify(
            backup,
            null,
            2
        );


    const blob =
        new Blob(
            [json],
            {
                type:
                    "application/json"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const anchor =
        document.createElement(
            "a"
        );


    anchor.href = url;


    anchor.download =
        `PG-Finance-Backup-${getToday()}.json`;


    document.body.appendChild(
        anchor
    );


    anchor.click();


    anchor.remove();


    URL.revokeObjectURL(
        url
    );


    showToast(
        "Backup exported successfully.",
        "success"
    );
}


/* =========================================================
   35. IMPORT DATA
========================================================= */

function importData(file) {

    if (!file) return;


    const reader =
        new FileReader();


    reader.onload = function(event) {

        try {

            const backup =
                JSON.parse(
                    event.target.result
                );


            if (
                !backup.data ||
                !Array.isArray(
                    backup.data.transactions
                )
            ) {

                throw new Error(
                    "Invalid backup file."
                );
            }


            appData = {

                ...appData,

                ...backup.data

            };


            saveData();


            refreshAll();


            showToast(
                "Backup imported successfully.",
                "success"
            );


        } catch (error) {

            console.error(error);


            showToast(
                "Invalid backup file.",
                "error"
            );
        }
    };


    reader.readAsText(
        file
    );
}


/* =========================================================
   36. ARCHIVE MONTH
========================================================= */

function archiveCurrentMonth() {

    const month =
        getCurrentMonth();


    const alreadyArchived =
        appData.archivedMonths
            .includes(month);


    if (alreadyArchived) {

        showToast(
            "This month is already archived.",
            "warning"
        );

        return;
    }


    appData.archivedMonths.push(
        month
    );


    saveData();


    showToast(
        `${month} archived successfully.`,
        "success"
    );
}


/* =========================================================
   37. REFRESH EVERYTHING
========================================================= */

function refreshAll() {

    renderDashboard();

    renderContributions();

    renderExpenses();

    renderMembers();

    renderBalances();

    renderSettlement();

    renderTransactions();

    renderDailyHistory();

    renderStatistics();

    renderReports();

    renderSettings();
}


/* =========================================================
   38. EVENT LISTENERS
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /* LOAD DATA */

        loadData();


        /* DEFAULT DATES */

        setDefaultDates();


        /* DASHBOARD */

        refreshAll();


        /* NAVIGATION */

        $$(".nav-item")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        navigateTo(
                            button.dataset.section
                        );

                    }
                );

            });


        /* SECTION LINKS */

        $$("[data-section-link]")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        navigateTo(
                            button.dataset.sectionLink
                        );

                    }
                );

            });


        /* OPEN MODALS */

        $$("[data-open-modal]")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        openModal(
                            button.dataset.openModal
                        );

                    }
                );

            });


        /* CLOSE MODALS */

        $$("[data-close-modal]")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        closeModal(
                            button.dataset.closeModal
                        );

                    }
                );

            });


        /* CLOSE MODAL WHEN CLICKING OUTSIDE */

        $$(".modal-overlay")
            .forEach(overlay => {

                overlay.addEventListener(
                    "click",
                    event => {

                        if (
                            event.target ===
                            overlay
                        ) {

                            closeModal(
                                overlay.id
                            );

                        }

                    }
                );

            });


        /* ESCAPE KEY */

        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Escape"
                ) {

                    $$(".modal-overlay.active")
                        .forEach(
                            modal =>
                                closeModal(
                                    modal.id
                                )
                        );
                }

            }
        );


        /* CONTRIBUTION FORM */

        $("contributionForm")
            ?.addEventListener(
                "submit",
                addContribution
            );


        /* EXPENSE FORM */

        $("expenseForm")
            ?.addEventListener(
                "submit",
                addExpense
            );


        /* EXPENSE SHARE PREVIEW */

        $("expenseAmount")
            ?.addEventListener(
                "input",
                updateExpenseSharePreview
            );


        document
            .querySelectorAll(
                'input[name="expenseShare"]'
            )
            .forEach(
                checkbox => {

                    checkbox.addEventListener(
                        "change",
                        updateExpenseSharePreview
                    );

                }
            );


        /* SELECT ALL */

        $("selectAllMembers")
            ?.addEventListener(
                "click",
                () => {

                    const checkboxes =
                        document.querySelectorAll(
                            'input[name="expenseShare"]'
                        );


                    const allChecked =
                        Array.from(
                            checkboxes
                        ).every(
                            checkbox =>
                                checkbox.checked
                        );


                    setAllMemberCheckboxes(
                        !allChecked
                    );


                    updateExpenseSharePreview();

                }
            );


        /* CONTRIBUTION FILTER */

        $("contributionMemberFilter")
            ?.addEventListener(
                "change",
                renderContributionTable
            );


        /* EXPENSE FILTER */

        $("expenseCategoryFilter")
            ?.addEventListener(
                "change",
                renderExpenseTable
            );


        /* TRANSACTION FILTER */

        $("transactionTypeFilter")
            ?.addEventListener(
                "change",
                renderTransactions
            );


        /* HISTORY DATE */

        $("historyDate")
            ?.addEventListener(
                "change",
                renderDailyHistory
            );


        /* REPORT */

        $("generateReportButton")
            ?.addEventListener(
                "click",
                () => {

                    generateMonthlyReport(
                        $("reportMonth").value
                    );

                }
            );


        /* SETTLEMENT */

        $("calculateSettlementButton")
            ?.addEventListener(
                "click",
                () => {

                    renderSettlement();

                    showToast(
                        "Settlement calculated.",
                        "success"
                    );

                }
            );


        /* QUICK EXPENSE */

        $("quickExpenseButton")
            ?.addEventListener(
                "click",
                () => {

                    openModal(
                        "expenseModal"
                    );

                }
            );


        /* EXPORT */

        $("exportDataButton")
            ?.addEventListener(
                "click",
                exportData
            );


        /* IMPORT */

        $("importDataButton")
            ?.addEventListener(
                "click",
                () => {

                    $("importFileInput")
                        .click();

                }
            );


        $("importFileInput")
            ?.addEventListener(
                "change",
                event => {

                    const file =
                        event.target.files[0];

                    importData(file);

                    event.target.value =
                        "";

                }
            );


        /* ARCHIVE */

        $("archiveMonthButton")
            ?.addEventListener(
                "click",
                archiveCurrentMonth
            );


        /* MOBILE MENU */

        $("menuButton")
            ?.addEventListener(
                "click",
                () => {

                    $("sidebar")
                        .classList.toggle(
                            "open"
                        );

                }
            );


        /* NOTIFICATION */

        $("notificationButton")
            ?.addEventListener(
                "click",
                () => {

                    const settlements =
                        calculateSettlement();


                    if (
                        settlements.length ===
                        0
                    ) {

                        showToast(
                            "Everyone is currently settled.",
                            "success"
                        );

                    } else {

                        showToast(
                            `${settlements.length} settlement payment(s) pending.`,
                            "warning"
                        );

                    }

                }
            );


        /* TRANSACTION DETAILS */

        $("transactionTableBody")
            ?.addEventListener(
                "click",
                event => {

                    const row =
                        event.target.closest(
                            "tr[data-transaction-id]"
                        );


                    if (!row) return;


                    showTransactionDetails(
                        row.dataset.transactionId
                    );

                }
            );


        /* EXPENSE DETAILS */

        $("expenseTableBody")
            ?.addEventListener(
                "click",
                event => {

                    const button =
                        event.target.closest(
                            "[data-view-expense]"
                        );


                    if (!button) return;


                    const expense =
                        appData.expenses.find(
                            e =>
                                e.id ===
                                button.dataset
                                    .viewExpense
                        );


                    if (!expense) return;


                    showExpenseDetails(
                        expense
                    );

                }
            );


        /* CURRENT DATE */

        updateCurrentDate();


        /* INITIAL SHARE PREVIEW */

        updateExpenseSharePreview();

    }
);


/* =========================================================
   39. CURRENT DATE DISPLAY
========================================================= */

function updateCurrentDate() {

    if (!$("currentDate")) return;


    const date =
        new Date();


    $("currentDate")
        .textContent =
        date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
}


/* =========================================================
   40. EXPENSE DETAILS
========================================================= */

function showExpenseDetails(
    expense
) {

    const container =
        $("transactionDetailsContent");


    container.innerHTML = `

        <div class="detail-row">

            <span>
                Expense ID
            </span>

            <strong>
                ${escapeHTML(
                    expense.id
                )}
            </strong>

        </div>


        <div class="detail-row">

            <span>
                Item
            </span>

            <strong>
                ${escapeHTML(
                    expense.item
                )}
            </strong>

        </div>


        <div class="detail-row">

            <span>
                Category
            </span>

            <strong>
                ${escapeHTML(
                    expense.category
                )}
            </strong>

        </div>


        <div class="detail-row">

            <span>
                Amount
            </span>

            <strong>
                ${formatCurrency(
                    expense.amount
                )}
            </strong>

        </div>


        <div class="detail-row">

            <span>
                Paid By
            </span>

            <strong>
                ${escapeHTML(
                    expense.paidBy
                )}
            </strong>

        </div>


        <div class="detail-row">

            <span>
                Shared By
            </span>

            <strong>
                ${expense.sharedBy
                    .map(
                        escapeHTML
                    )
                    .join(", ")}
            </strong>

        </div>


        <div class="detail-row">

            <span>
                Share Per Person
            </span>

            <strong>
                ${formatCurrency(
                    expense.amount /
                    expense.sharedBy.length
                )}
            </strong>

        </div>


        <div class="detail-row">

            <span>
                Date
            </span>

            <strong>
                ${formatDate(
                    expense.date
                )}
            </strong>

        </div>


        <div class="detail-row">

            <span>
                Note
            </span>

            <strong>
                ${escapeHTML(
                    expense.note ||
                    "-"
                )}
            </strong>

        </div>

    `;


    openModal(
        "transactionDetailsModal"
    );
}


/* =========================================================
   41. INITIALIZE
========================================================= */

/*
    This ensures that if the script is loaded
    after DOMContentLoaded, data is still available.
*/

if (
    document.readyState !==
    "loading"
) {

    loadData();

    setDefaultDates();

    refreshAll();

    updateCurrentDate();
}


/* =========================================================
   END OF APPLICATION
========================================================= */