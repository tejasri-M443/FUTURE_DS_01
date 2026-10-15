
"use strict";

const money = value => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
}).format(value);

const number = value => new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
}).format(value);

const compactMoney = value => {
    if (Math.abs(value) >= 1000000) return "$" + (value / 1000000).toFixed(1) + "M";
    if (Math.abs(value) >= 1000) return "$" + (value / 1000).toFixed(0) + "K";
    return money(value);
};

const palette = {
    gold: "#d6b77a",
    mint: "#a6c8b4",
    lavender: "#c4b2d9",
    rose: "#d4a5a0",
    blue: "#a8bac7",
    muted: "#a9ada4",
    grid: "rgba(230,230,210,0.09)"
};

let charts = {};
let currentData = [];

const demoData = [
    ["2019-01-10","ORD-1001","West","Technology","Laptop",2,2400,480],
    ["2019-01-12","ORD-1002","East","Office Supplies","Paper",8,160,35],
    ["2019-02-08","ORD-1003","West","Technology","Mobile Phone",3,1800,360],
    ["2019-03-16","ORD-1004","Central","Furniture","Office Chair",4,1200,180],
    ["2019-04-03","ORD-1005","South","Technology","Headphones",5,750,190],
    ["2019-05-21","ORD-1006","East","Furniture","Desk",2,900,100],
    ["2019-06-10","ORD-1007","West","Office Supplies","Binders",12,300,70],
    ["2019-07-18","ORD-1008","Central","Technology","Laptop",3,3600,700],
    ["2019-08-09","ORD-1009","South","Office Supplies","Paper",15,240,60],
    ["2019-09-13","ORD-1010","East","Technology","Mobile Phone",4,2400,520],
    ["2019-10-22","ORD-1011","West","Furniture","Office Chair",5,1500,230],
    ["2019-11-11","ORD-1012","Central","Technology","Headphones",8,1200,320],
    ["2019-12-04","ORD-1013","South","Furniture","Desk",3,1350,180],
    ["2020-01-17","ORD-1014","West","Technology","Laptop",4,4800,950],
    ["2020-02-14","ORD-1015","East","Office Supplies","Binders",10,250,55],
    ["2020-03-12","ORD-1016","Central","Technology","Mobile Phone",6,3600,750],
    ["2020-04-25","ORD-1017","South","Technology","Headphones",7,1050,260],
    ["2020-05-08","ORD-1018","West","Furniture","Office Chair",3,900,140],
    ["2020-06-19","ORD-1019","East","Technology","Laptop",5,6000,1250],
    ["2020-07-23","ORD-1020","Central","Office Supplies","Paper",20,400,100],
    ["2020-08-15","ORD-1021","West","Technology","Mobile Phone",5,3000,630],
    ["2020-09-28","ORD-1022","South","Furniture","Desk",4,1800,250],
    ["2020-10-06","ORD-1023","East","Technology","Headphones",9,1350,360],
    ["2020-11-20","ORD-1024","Central","Technology","Laptop",6,7200,1450],
    ["2020-12-09","ORD-1025","West","Office Supplies","Binders",18,450,110],
    ["2021-01-14","ORD-1026","South","Technology","Mobile Phone",8,4800,980],
    ["2021-02-16","ORD-1027","East","Furniture","Office Chair",7,2100,330],
    ["2021-03-07","ORD-1028","West","Technology","Laptop",5,6000,1200],
    ["2021-04-19","ORD-1029","Central","Office Supplies","Paper",24,480,125],
    ["2021-05-24","ORD-1030","South","Technology","Headphones",10,1500,410],
    ["2021-06-13","ORD-1031","East","Technology","Mobile Phone",7,4200,880],
    ["2021-07-27","ORD-1032","West","Furniture","Desk",6,2700,390],
    ["2021-08-18","ORD-1033","Central","Technology","Laptop",7,8400,1700],
    ["2021-09-09","ORD-1034","East","Office Supplies","Binders",22,550,145],
    ["2021-10-12","ORD-1035","West","Technology","Mobile Phone",9,5400,1120],
    ["2021-11-16","ORD-1036","South","Furniture","Office Chair",8,2400,370],
    ["2021-12-21","ORD-1037","Central","Technology","Laptop",10,12000,2450]
].map(r => ({
    date: r[0],
    orderId: r[1],
    region: r[2],
    category: r[3],
    product: r[4],
    quantity: r[5],
    sales: r[6],
    profit: r[7]
}));

function setStatus(message) {
    const el = document.getElementById("dataStatus");
    if (el) el.textContent = message;
}

function cleanHeader(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

function findColumn(headers, aliases) {
    const cleaned = headers.map(cleanHeader);
    for (const alias of aliases) {
        const index = cleaned.indexOf(cleanHeader(alias));
        if (index !== -1) return headers[index];
    }
    return null;
}

function parseNumber(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const parsed = Number(String(value ?? "").replace(/[$,\s%]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDate(value) {
    if (!value) return null;

    // Support common formats, including YYYY-MM-DD and MM/DD/YYYY.
    const text = String(value).trim();
    let date = new Date(text);

    if (!Number.isNaN(date.getTime())) return date;

    const match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
    if (match) {
        let year = Number(match[3]);
        if (year < 100) year += year < 50 ? 2000 : 1900;
        date = new Date(year, Number(match[1]) - 1, Number(match[2]));
        if (!Number.isNaN(date.getTime())) return date;
    }

    return null;
}

function normalizeCSV(rows) {
    if (!rows.length) throw new Error("The CSV file contains no data rows.");

    const headers = Object.keys(rows[0]);

    const columns = {
        date: findColumn(headers, ["Order Date", "Date", "OrderDate", "Invoice Date"]),
        orderId: findColumn(headers, ["Order ID", "OrderID", "Order Number", "Transaction ID"]),
        region: findColumn(headers, ["Region", "Market", "Territory"]),
        category: findColumn(headers, ["Category", "Product Category", "Sub-Category"]),
        product: findColumn(headers, ["Product Name", "Product", "Item Name", "ProductName"]),
        quantity: findColumn(headers, ["Quantity", "Qty", "Units Sold"]),
        sales: findColumn(headers, ["Sales", "Revenue", "Total Sales", "Amount"]),
        profit: findColumn(headers, ["Profit", "Net Profit", "Total Profit"])
    };

    const missing = [];
    if (!columns.sales) missing.push("Sales");
    if (!columns.date) missing.push("Order Date / Date");

    if (missing.length) {
        throw new Error(
            "Could not find required column(s): " + missing.join(", ") +
            ". Please check the header names in your CSV."
        );
    }

    const result = rows.map((row, index) => {
        const date = normalizeDate(row[columns.date]);
        return {
            date,
            orderId: columns.orderId ? String(row[columns.orderId] || "Order " + (index + 1)).trim() : "Order " + (index + 1),
            region: columns.region ? String(row[columns.region] || "Unknown").trim() : "Unknown",
            category: columns.category ? String(row[columns.category] || "Uncategorized").trim() : "Uncategorized",
            product: columns.product ? String(row[columns.product] || "Unnamed product").trim() : "Unnamed product",
            quantity: columns.quantity ? parseNumber(row[columns.quantity]) : 0,
            sales: parseNumber(row[columns.sales]),
            profit: columns.profit ? parseNumber(row[columns.profit]) : 0
        };
    }).filter(row => row.date && Number.isFinite(row.sales));

    if (!result.length) {
        throw new Error("No usable rows found. Check your date format and sales values.");
    }

    return result;
}

function groupSum(rows, key, metric = "sales") {
    const grouped = {};
    rows.forEach(row => {
        const label = row[key] || "Unknown";
        grouped[label] = (grouped[label] || 0) + row[metric];
    });
    return grouped;
}

function monthlyTotals(rows) {
    const grouped = {};

    rows.forEach(row => {
        const key = row.date.getFullYear() + "-" + String(row.date.getMonth() + 1).padStart(2, "0");
        if (!grouped[key]) grouped[key] = { sales: 0, profit: 0 };
        grouped[key].sales += row.sales;
        grouped[key].profit += row.profit;
    });

    const keys = Object.keys(grouped).sort();
    return {
        labels: keys.map(key => {
            const [year, month] = key.split("-");
            return new Date(Number(year), Number(month) - 1, 1)
                .toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        }),
        sales: keys.map(key => grouped[key].sales),
        profit: keys.map(key => grouped[key].profit)
    };
}

function updateKPIs(rows) {
    const sales = rows.reduce((sum, row) => sum + row.sales, 0);
    const profit = rows.reduce((sum, row) => sum + row.profit, 0);
    const quantity = rows.reduce((sum, row) => sum + row.quantity, 0);
    const orders = new Set(rows.map(row => row.orderId)).size;
    const margin = sales ? (profit / sales) * 100 : 0;

    document.getElementById("totalSales").textContent = money(sales);
    document.getElementById("totalProfit").textContent = money(profit);
    document.getElementById("totalOrders").textContent = number(orders);
    document.getElementById("totalQuantity").textContent = number(quantity);
    document.getElementById("profitMargin").textContent = margin.toFixed(1) + "%";

    const dates = rows.map(row => row.date).filter(Boolean).sort((a, b) => a - b);
    if (dates.length) {
        const format = date => date.toLocaleDateString("en-GB", {
            day: "2-digit", month: "short", year: "numeric"
        });
        document.getElementById("dateRange").textContent =
            format(dates[0]) + " — " + format(dates[dates.length - 1]);
    }
}

function baseChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 550 },
        plugins: {
            legend: {
                labels: {
                    color: "#d8d8cc",
                    usePointStyle: true,
                    pointStyle: "circle",
                    boxWidth: 7,
                    padding: 15,
                    font: { family: "DM Sans", size: 10 }
                }
            },
            tooltip: {
                backgroundColor: "#20241f",
                titleColor: "#f3f0e8",
                bodyColor: "#d6d6cb",
                borderColor: "rgba(214,183,122,.35)",
                borderWidth: 1,
                padding: 11,
                callbacks: {
                    label: context => {
                        const value = context.parsed.y ?? context.parsed.x ?? context.parsed;
                        return " " + context.dataset.label + ": " + money(value);
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: { color: "#a9ada4", font: { family: "DM Sans", size: 9 }, maxRotation: 0 },
                grid: { color: palette.grid },
                border: { color: "rgba(255,255,255,.12)" }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    color: "#a9ada4",
                    font: { family: "DM Sans", size: 9 },
                    callback: value => compactMoney(value)
                },
                grid: { color: palette.grid },
                border: { display: false }
            }
        }
    };
}

function drawChart(id, config) {
    if (charts[id]) charts[id].destroy();
    const canvas = document.getElementById(id);
    if (!canvas) return;
    charts[id] = new Chart(canvas, config);
}

function renderCharts(rows) {
    if (typeof Chart === "undefined") {
        setStatus("Chart library did not load. Check your internet connection and refresh the page.");
        return;
    }

    const monthly = monthlyTotals(rows);
    const salesGradient = context => {
        const chart = context.chart;
        const area = chart.chartArea;
        if (!area) return palette.gold;
        const gradient = chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
        gradient.addColorStop(0, "rgba(214,183,122,.9)");
        gradient.addColorStop(1, "rgba(214,183,122,.2)");
        return gradient;
    };

    const trendOptions = baseChartOptions();
    trendOptions.interaction = { mode: "index", intersect: false };
    trendOptions.scales.x.ticks.maxTicksLimit = 9;

    drawChart("salesTrendChart", {
        type: "bar",
        data: {
            labels: monthly.labels,
            datasets: [
                {
                    type: "bar",
                    label: "Sales",
                    data: monthly.sales,
                    backgroundColor: "rgba(166,200,180,.75)",
                    borderColor: palette.mint,
                    borderWidth: 1,
                    borderRadius: 3,
                    maxBarThickness: 20
                },
                {
                    type: "line",
                    label: "Profit",
                    data: monthly.profit,
                    borderColor: palette.gold,
                    backgroundColor: salesGradient,
                    pointBackgroundColor: palette.gold,
                    pointRadius: 2,
                    pointHoverRadius: 5,
                    borderWidth: 2,
                    tension: .35
                }
            ]
        },
        options: trendOptions
    });

    const products = Object.entries(groupSum(rows, "product"))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .reverse();

    const productOptions = baseChartOptions();
    productOptions.indexAxis = "y";
    productOptions.plugins.legend.display = false;
    productOptions.scales.x.ticks.callback = value => compactMoney(value);
    productOptions.scales.y.grid.display = false;

    drawChart("topProductsChart", {
        type: "bar",
        data: {
            labels: products.map(item => item[0]),
            datasets: [{
                label: "Sales",
                data: products.map(item => item[1]),
                backgroundColor: [palette.rose, palette.lavender, palette.blue, palette.mint, palette.gold],
                borderRadius: 5,
                maxBarThickness: 25
            }]
        },
        options: productOptions
    });

    const categories = Object.entries(groupSum(rows, "category"))
        .sort((a, b) => b[1] - a[1]);

    drawChart("categoryChart", {
        type: "doughnut",
        data: {
            labels: categories.map(item => item[0]),
            datasets: [{
                label: "Sales",
                data: categories.map(item => item[1]),
                backgroundColor: [palette.gold, palette.mint, palette.lavender, palette.rose, palette.blue],
                borderColor: "#20241f",
                borderWidth: 3,
                hoverOffset: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "65%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "#d8d8cc",
                        padding: 12,
                        usePointStyle: true,
                        pointStyle: "circle",
                        font: { family: "DM Sans", size: 10 }
                    }
                },
                tooltip: {
                    backgroundColor: "#20241f",
                    borderColor: "rgba(214,183,122,.35)",
                    borderWidth: 1,
                    callbacks: {
                        label: context => {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percent = total ? context.raw / total * 100 : 0;
                            return " " + context.label + ": " + money(context.raw) + " (" + percent.toFixed(1) + "%)";
                        }
                    }
                }
            }
        }
    });

    const regions = Object.entries(groupSum(rows, "region"))
        .sort((a, b) => b[1] - a[1]);

    const regionOptions = baseChartOptions();
    regionOptions.plugins.legend.display = false;
    regionOptions.scales.y.ticks.callback = value => compactMoney(value);

    drawChart("regionChart", {
        type: "bar",
        data: {
            labels: regions.map(item => item[0]),
            datasets: [{
                label: "Sales",
                data: regions.map(item => item[1]),
                backgroundColor: [palette.gold, palette.mint, palette.lavender, palette.rose, palette.blue],
                borderRadius: 5,
                maxBarThickness: 42
            }]
        },
        options: regionOptions
    });
}

function renderInsights(rows) {
    const sales = rows.reduce((sum, row) => sum + row.sales, 0);
    const profit = rows.reduce((sum, row) => sum + row.profit, 0);
    const margin = sales ? profit / sales * 100 : 0;

    const categories = Object.entries(groupSum(rows, "category")).sort((a, b) => b[1] - a[1]);
    const regions = Object.entries(groupSum(rows, "region")).sort((a, b) => b[1] - a[1]);
    const products = Object.entries(groupSum(rows, "product")).sort((a, b) => b[1] - a[1]);
    const months = monthlyTotals(rows);

    const bestMonthIndex = months.sales.indexOf(Math.max(...months.sales));
    const bestMonth = months.labels[bestMonthIndex] || "N/A";
    const topCategory = categories[0];
    const topRegion = regions[0];
    const topProduct = products[0];
    const weakestRegion = regions[regions.length - 1];

    const insightItems = [
        "Total sales reached " + money(sales) + ", generating " + money(profit) + " in profit.",
        "Overall profit margin is " + margin.toFixed(1) + "% of total sales.",
        topCategory ? topCategory[0] + " is the leading category, contributing " + (sales ? (topCategory[1] / sales * 100).toFixed(1) : 0) + "% of sales." : "Category performance is unavailable.",
        topRegion ? topRegion[0] + " is the highest-sales region at " + money(topRegion[1]) + "." : "Regional performance is unavailable.",
        topProduct ? topProduct[0] + " is the top product by sales at " + money(topProduct[1]) + "." : "Product performance is unavailable.",
        "The strongest month by sales in this dataset is " + bestMonth + "."
    ];

    const recommendations = [
        topCategory ? "Study what drives " + topCategory[0] + " sales and apply successful tactics to other categories." : "Review category-level performance to identify growth opportunities.",
        weakestRegion ? "Investigate customer demand, product mix and marketing in the " + weakestRegion[0] + " region." : "Compare regional results to identify underserved markets.",
        topProduct ? "Check inventory and availability for " + topProduct[0] + " to help avoid missed sales." : "Review best-selling products and inventory levels.",
        margin < 0 ? "Review discounts, product costs and pricing because the overall profit is negative." : "Track profit margin alongside revenue so sales growth remains profitable.",
        "Compare performance across months and seasons before setting future sales targets."
    ];

    document.getElementById("insightsList").innerHTML =
        insightItems.map(item => "<li>" + escapeHTML(item) + "</li>").join("");

    document.getElementById("recommendationsList").innerHTML =
        recommendations.map(item => "<li>" + escapeHTML(item) + "</li>").join("");
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function renderDashboard(rows, sourceLabel) {
    currentData = rows;
    updateKPIs(rows);
    renderCharts(rows);
    renderInsights(rows);
    setStatus(sourceLabel + " · " + number(rows.length) + " records loaded.");
}

function loadCSVFile(file) {
    if (!file) return;

    if (typeof Papa === "undefined") {
        setStatus("CSV parser did not load. Check your internet connection and refresh.");
        return;
    }

    setStatus("Reading " + file.name + "…");

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: result => {
            try {
                const rows = normalizeCSV(result.data);
                renderDashboard(rows, "Loaded " + file.name);
            } catch (error) {
                setStatus("CSV issue: " + error.message);
                console.error(error);
            }
        },
        error: error => {
            setStatus("Could not read CSV: " + error.message);
        }
    });
}

function tryAutomaticCSV() {
    if (typeof Papa === "undefined") {
        renderDashboard(demoData.map(row => ({
            ...row,
            date: normalizeDate(row.date)
        })), "Demo data shown because external libraries could not load");
        return;
    }

    Papa.parse("./Superstore_Database.csv", {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: result => {
            try {
                const rows = normalizeCSV(result.data);
                renderDashboard(rows, "Loaded Superstore_Database.csv");
            } catch (error) {
                console.warn("Automatic CSV loading failed:", error.message);
                renderDashboard(demoData.map(row => ({
                    ...row,
                    date: normalizeDate(row.date)
                })), "Demo data shown · " + error.message + " Use Load your CSV to select your dataset.");
            }
        },
        error: error => {
            console.warn("Automatic CSV loading failed:", error);
            renderDashboard(demoData.map(row => ({
                ...row,
                date: normalizeDate(row.date)
            })), "Demo data shown · Place Superstore_Database.csv beside index.html or use Load your CSV.");
        }
    });
}

document.getElementById("csvFile").addEventListener("change", event => {
    loadCSVFile(event.target.files[0]);
});

// Render a visible dashboard immediately, without waiting for the CSV.
renderDashboard(demoData.map(row => ({
    ...row,
    date: normalizeDate(row.date)
})), "Example data shown while checking your CSV…");

tryAutomaticCSV();
