"use strict";

function html_table_handle_on_paste_default(table, td) {
    return function(event) {
        let data = (event.clipboardData || window.clipboardData).getData("text");
        data = data.slice(0, -1);
        let row_data = data.split("\n");
        let new_td = td;

        if (row_data.length <= 0)
            return;

        console.log(row_data);
        let max_rows = Math.min(table.rows.length - new_td.parentElement.rowIndex, row_data.length);
        for (let i = 0; i < max_rows; ++i) {
            let column_data = row_data[i].split("\t");
            let columns = new_td.parentElement.cells.length;
            let paste_columns = column_data.length;
            let max_columns = Math.min(columns - new_td.cellIndex, paste_columns);

            for (let j = 0; j < max_columns; ++j) {
                new_td.parentElement.cells[j + new_td.cellIndex].innerText = column_data[j];
                //console.log("look here>");
                //console.log(table.rows[0].cells[j + new_td.cellIndex]);
               //console.log(table.rows[0].cells[j + new_td.cellIndex].innerText);
                let day = table.rows[0].cells[j + new_td.cellIndex].innerText;
                //console.log(new_td.parentElement.rowIndex - 1);
                //console.log(table.internal_data);
                table.internal_data.values[new_td.parentElement.rowIndex - 1][day] = column_data[j];
            }

            if (new_td.parentElement.rowIndex < table.rows.length - 1)
                new_td = table.rows[new_td.parentElement.rowIndex + 1].cells[new_td.cellIndex];
        }

        console.log(table.rows.length);
        event.preventDefault();
    };
}

function html_table_handle_on_change_default(table, td) {
    return function(event) {
        //console.log("Change <" + td.innerText + ">");
        if (td.innerText === "\n") {
            return;
        }
        table.internal_data.values[td.parentElement.rowIndex - 1][td.internal_j] = parseFloat(td.innerText);
    };
}

function html_table_handle_on_double_click(table, td) {
    return function(event) {
        table.internal_editable.forEach((item) => {
            item.contentEditable = false;
        });
        table.internal_editable = [];
        td.contentEditable = true;
        //td.innerText = "";
        table.internal_editable.push(td);
    };
}

function html_table_setup_td_handlers(table, td, settings) {
    td.addEventListener("click", html_table_handle_on_double_click(table, td));
    
    if (settings.table_on_change_callback)
        td.addEventListener("input", settings.table_on_change_callback(table, td));
    else
        td.addEventListener("input", html_table_handle_on_change_default(table, td));

    if (settings.table_on_paste_callback)
        td.addEventListener("paste", settings.table_on_paste_callback(table, td));
    else
        td.addEventListener("paste", html_table_handle_on_paste_default(table, td));
}

function html_table_create(table_data, settings) {
    let table = document.createElement("table");
    let thead = document.createElement("thead");
    let tr = document.createElement("tr");

    // Bootstrap classes
    table.classList.add("table-striped");
    table.classList.add("table-bordered");;
    if (settings.classes && settings.classes.table) {
        settings.classes.table.forEach((i) => {
            table.classList.add(i);
        });
    }
    table.id = settings.table_id;
    table.internal_data = table_data;
    table.internal_settings = settings;
    table.internal_editable = [];

    for (var i in table_data.values[0]) {
        if (table_data.values[0].hasOwnProperty(i)) {
            let th = document.createElement("th");
            if (settings.classes && settings.classes.th) {
                settings.classes.th.forEach((i) => {
                    th.classList.add(i);
                });
            }
            th.style.textAlign = "center";
            th.style.verticalAlign = "center";
            th.innerHTML = table_data.headers[i];
            tr.appendChild(th);
        }
    }

    if (settings.enable_insert_remove_gui) {
        // Add extra column for row insertion/removal control buttons
        let th = document.createElement("th");
        th.classList.add("px-1");
        th.style.textAlign = "center";
        th.style.verticalAlign = "center";
        th.innerHTML = "+-";
        tr.appendChild(th);
    }

    thead.appendChild(tr);
    table.appendChild(thead);

    let tbody = document.createElement("tbody");
    for (let i = 0; i < table_data.values.length; ++i) {
        tr = document.createElement("tr");
        for (var j in table_data.values[0]) {
            if (table_data.values[0].hasOwnProperty(j)) {
                let td = document.createElement("td");
                let value = table_data.values[i][j];
                td.style.textAlign = "center";
                //td.contentEditable = true;
                td.innerText = value;
                if (!isNaN(value) && !Number.isInteger(value) && settings.round_threshold) {
                    td.innerText = value.toFixed(settings.round_threshold);
                }
                td.internal_i = i;
                td.internal_j = j;
                html_table_setup_td_handlers(table, td, settings);
                tr.appendChild(td);
            }
        }

        if (settings.enable_insert_remove_gui) {
            // Add button for row insertion/removal control
            let td = document.createElement("td");
            td.style.textAlign = "center";
            let pair = html_table_create_insert_remove_buttons();

            pair.insert.addEventListener("click", html_table_handle_insert_row(table, tr, settings.table_on_change_callback));
            pair.remove.addEventListener("click", html_table_handle_remove_row(table, tr, settings.table_on_change_callback));
            td.appendChild(pair.insert);
            td.appendChild(pair.remove);
            tr.appendChild(td);
        }

        tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    return table;
}

function html_table_create_insert_remove_buttons() {
    let button_insert = document.createElement("button");
    let button_remove = document.createElement("button");
    button_insert.style.width = button_remove.style.width = "30px";
    button_insert.innerText = "+";
    button_remove.innerText = "-";
    button_insert.classList.add("btn");
    button_insert.classList.add("btn-primary");
    button_insert.classList.add("btn-sm");
    //button_insert.classList.add("px-1");
    //button_insert.classList.add("py-1");
    button_insert.classList.add("ml-1");
    button_remove.classList.add("btn");
    button_remove.classList.add("btn-danger");
    button_remove.classList.add("btn-sm");
    //button_remove.classList.add("px-0");
    //button_remove.classList.add("py-1");
    button_remove.classList.add("mx-1");
    //button_remove.classList.add("my-1");

    return { insert: button_insert, remove: button_remove };
}

function html_table_handle_insert_row(table, tr, table_on_change_callback) {
    return function() {
        let new_tr = table.insertRow(tr.rowIndex+1);
        let empty_content = {};
        for (var i in table.internal_data.values[0]) {
            if (table.internal_data.values[0].hasOwnProperty(i)) {
                empty_content[i] = 0;
                let td = document.createElement("td");
                td.style.textAlign = "center";
                //td.contentEditable = true;
                td.innerText = 0;
                td.internal_i = new_tr.rowIndex;
                td.internal_j = i;
                html_table_setup_td_handlers(table, td, table.internal_settings);
                new_tr.appendChild(td);
            }
        }
        table.internal_data.values.splice(tr.rowIndex, 0, empty_content);

        // Add button for row insertion/removal control
        if (table.internal_settings.enable_insert_remove_gui) {
            let td = document.createElement("td");
            td.style.textAlign = "center";
            let pair = html_table_create_insert_remove_buttons();
            pair.insert.addEventListener("click", html_table_handle_insert_row(table, new_tr, table_on_change_callback));
            pair.remove.addEventListener("click", html_table_handle_remove_row(table, new_tr, table_on_change_callback));
            td.appendChild(pair.insert);
            td.appendChild(pair.remove);
            new_tr.appendChild(td);
        }

        console.log("inserting over");
        console.log(table);
    };
}

function html_table_update(table) {
    if (table.internal_data.values.length <= 0)
        return;

    for (let i = 1; i < table.rows.length; ++i) {
        Object.keys(table.internal_data.values[i - 1]).forEach((key, idx) => {
            let value = table.internal_data.values[i - 1][key];
            table.rows[i].cells.item(idx).innerText = value;
            //console.log("Updating " + key + " at idx " + idx + " with value " + value);
            if (!isNaN(value) && !Number.isInteger(value) && table.internal_settings.round_threshold) {
                table.rows[i].cells.item(idx).innerText = value.toFixed(table.internal_settings.round_threshold);
            }
        });
    }
}

function html_table_handle_remove_row(table, tr) {
    return function() {
        table.internal_data.values.splice(tr.rowIndex - 1, 1);
        //console.log("deleting " + tr.rowIndex - 1);
        //console.log(table.internal_data.values);
        table.deleteRow(tr.rowIndex);
        html_table_update(table);
        if (table.internal_settings.table_on_remove_row) {
            table.internal_settings.table_on_remove_row(table, tr);
        }
    };
}

function get_data_from_html_table(html_table) {
    let thead = html_table.getElementsByTagName("thead")[0];
    let tbody = html_table.getElementsByTagName("tbody")[0];
    let data_table = [];

    let tr = thead.getElementsByTagName("tr")[0];

    let headers = [];
    for (let i = 0; i < tr.children.length; ++i) {
        headers.push(tr.children[i].innerText);
    }

    for (let i = 0; i < tbody.children.length; ++i) {
        let tr = tbody.children[i];
        data_table[i] = {};
        for (let j = 0; j < tr.children.length; ++j) {
            data_table[i][headers[j]] = tr.children[j].innerText;
        }
    }

    return data_table;
}
