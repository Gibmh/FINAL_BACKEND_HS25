from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/api/notify', methods=['POST'])
def receive_izero_data():
    # Lấy dữ liệu từ iZero gửi lên
    data = request.json
    print("📥 Dữ liệu từ iZero:")
    print(data)
    
    # Gửi phản hồi về iZero
    return jsonify({"status": "ok"}), 200

if __name__ == '__main__':
    # Đảm bảo server chạy ở port 5000
    app.run(host='0.0.0.0', port=5000)
