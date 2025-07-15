import csv

table_name = "products"
csv_file = "products.csv"
output_file = "input.txt"

# Các cột kiểu số nguyên
numeric_columns = {
    'bc_cost', 'discount', 'price', 'cash_back',
    'quantity', 'sold', 'stock'
}

with open(csv_file, newline='', encoding='utf-8') as f:
    reader = csv.reader(f)
    headers = next(reader)

    insert_statements = []
    for row in reader:
        values = []
        for col, val in zip(headers, row):
            if val.strip() == '':
                values.append('NULL')
            elif col in numeric_columns:
                values.append(val)
            else:
                escaped = val.replace("'", "''")
                values.append(f"'{escaped}'")
        values_str = ", ".join(values)

        update_part = ", ".join([
            f"{col} = VALUES({col})"
            for col in headers if col.lower() != 'id_product'
        ])

        sql = (
            f"INSERT INTO {table_name} ({', '.join(headers)}) "
            f"VALUES ({values_str}) "
            f"ON DUPLICATE KEY UPDATE {update_part};"
        )
        insert_statements.append(sql)

with open(output_file, 'w', encoding='utf-8') as out_f:
    for stmt in insert_statements:
        out_f.write(stmt + '\n')
