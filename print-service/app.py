from flask import Flask, request, jsonify
from reportlab.pdfgen import canvas
import sqlite3
import os
import uuid

app = Flask(__name__)
@app.route('/test')
def test_route():
    return 'This is a test route!'

# Configuración para la carpeta de archivos generados
UPLOAD_FOLDER = './files'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Función para generar el PDF de la factura
def generate_invoice_pdf(invoice_data, invoice_id):
    pdf_filename = f"fac-{invoice_id}.pdf"
    pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], pdf_filename)
    
    c = canvas.Canvas(pdf_path)
    c.drawString(100, 800, f"Factura ID: {invoice_id}")
    c.drawString(100, 780, f"Cliente: {invoice_data['customer_name']}")
    c.drawString(100, 760, f"Fecha: {invoice_data['date']}")
    c.drawString(100, 740, f"Total: {invoice_data['total_amount']}")
    
    # Aquí puedes agregar más detalles de la factura
    y_position = 720
    for item in invoice_data['items']:
        c.drawString(100, y_position, f"Producto: {item['name']} | Cantidad: {item['quantity']} | Precio: {item['price']}")
        y_position -= 20
    
    c.save()
    return pdf_filename

# Función para registrar el log en la base de datos
def log_print_job(job_id, invoice_id):
    conn = sqlite3.connect('logs.db')
    cursor = conn.cursor()
    cursor.execute('INSERT INTO print_logs (job_id, invoice_id, status) VALUES (?, ?, ?)', 
                   (job_id, invoice_id, 'completed'))
    conn.commit()
    conn.close()

# Endpoint para recibir la solicitud de impresión
@app.route('/print/factura/<invoice_id>', methods=['POST'])
def print_invoice(invoice_id):
    # Obtiene los datos de la factura del cuerpo de la solicitud
    invoice_data = request.json.get('invoice')
    
    # Generar PDF de la factura
    pdf_filename = generate_invoice_pdf(invoice_data, invoice_id)
    
    # Crear un job_id único para el trabajo de impresión
    job_id = f"print-{uuid.uuid4()}"
    
    # Guardar el log del trabajo en la base de datos
    log_print_job(job_id, invoice_id)
    
    # Devuelve el enlace al PDF y el job_id
    pdf_url = f"/files/{pdf_filename}"
    return jsonify({"pdf_url": pdf_url, "job_id": job_id}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

