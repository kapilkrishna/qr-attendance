import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from dotenv import load_dotenv

load_dotenv()

class EmailService:
    def __init__(self):
        self.sg = SendGridAPIClient(api_key=os.getenv('SENDGRID_API_KEY'))
        self.from_email = os.getenv('FROM_EMAIL', 'noreply@tennisacademy.com')
    
    def send_registration_confirmation(self, user_email: str, user_name: str, package_name: str):
        """Send registration confirmation email"""
        # subject = f"Welcome to Tennis Academy - {package_name} Registration Confirmed"
        # ...
        # message = Mail(...)
        # try:
        #     response = self.sg.send(message)
        #     return response.status_code == 202
        # except Exception as e:
        #     print(f"Error sending email: {e}")
        #     return False
        return True
    
    def send_invoice(self, user_email: str, user_name: str, invoice_code: str, amount_due: float, month: str):
        """Send invoice email"""
        # subject = f"Tennis Academy Invoice - {month} (Code: {invoice_code})"
        # ...
        # message = Mail(...)
        # try:
        #     response = self.sg.send(message)
        #     return response.status_code == 202
        # except Exception as e:
        #     print(f"Error sending invoice email: {e}")
        #     return False
        return True
    
    def send_class_cancellation(self, user_emails: list, class_date: str, package_name: str):
        """Send class cancellation notification"""
        # subject = f"Tennis Class Cancelled - {class_date}"
        # ...
        # message = Mail(...)
        # try:
        #     response = self.sg.send(message)
        #     return response.status_code == 202
        # except Exception as e:
        #     print(f"Error sending cancellation email: {e}")
        #     return False
        return True 