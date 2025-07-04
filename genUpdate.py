import csv

table_name = "consignors"
csv_file = "consignors.csv"
output_file = "input.txt"  # file sẽ ghi kết quả SQL vào

numeric_columns = {'cash_back', 'count'}  # ví dụ bạn điều chỉnh theo table

with open(csv_file, newline='', encoding='utf-8') as f:
    reader = csv.reader(f)
    headers = next(reader)

    insert_statements = []
    for row in reader:
        values = []
        for col, val in zip(headers, row):
            if val == '':
                values.append('NULL')
            elif col in numeric_columns:
                values.append(val)
            else:
                escaped = val.replace("'", "''")
                values.append(f"'{escaped}'")  # bao giá trị chuỗi trong nháy đơn
        values_str = ", ".join(values)

        update_part = ", ".join([f"{col} = new.{col}" for col in headers if col.lower() != 'id_consignor'])

        sql = (
            f"INSERT INTO {table_name} ({', '.join(headers)}) "
            f"VALUES ({values_str}) AS new "
            f"ON DUPLICATE KEY UPDATE {update_part};"
        )
        insert_statements.append(sql)

with open(output_file, 'w', encoding='utf-8') as out_f:
    for stmt in insert_statements:
        out_f.write(stmt + '\n')