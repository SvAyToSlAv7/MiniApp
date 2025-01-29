from flask import Flask, render_template  
  
app = Flask(__name__, template_folder='.')  
  
@app.route("/")  
def web():  
    return render_template('admin.html')  
  
if __name__ == "__main__":  
    app.run(debug=True)  
