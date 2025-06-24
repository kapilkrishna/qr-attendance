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
        subject = f"Welcome to Tennis Academy - {package_name} Registration Confirmed"
        
        html_content = f"""
        <html>
        <body>
            <h2>Welcome to Tennis Academy!</h2>
            <p>Dear {user_name},</p>
            <p>Your registration for <strong>{package_name}</strong> has been confirmed.</p>
            <p>We're excited to have you join our tennis program!</p>
            <p>You can now generate your QR code for attendance tracking.</p>
            <br>
            <p>Best regards,<br>Tennis Academy Team</p>
        </body>
        </html>
        """
        
        message = Mail(
            from_email=self.from_email,
            to_emails=user_email,
            subject=subject,
            html_content=html_content
        )
        
        try:
            response = self.sg.send(message)
            return response.status_code == 202
        except Exception as e:
            print(f"Error sending email: {e}")
            return False
    
    def send_invoice(self, user_email: str, user_name: str, invoice_code: str, amount_due: float, month: str):
        """Send invoice email"""
        subject = f"Tennis Academy Invoice - {month} (Code: {invoice_code})"
        
        html_content = f"""
        <html>
        <body>
            <h2>Tennis Academy Invoice</h2>
            <p>Dear {user_name},</p>
            <p>Your invoice for {month} is ready.</p>
            <p><strong>Invoice Code:</strong> {invoice_code}</p>
            <p><strong>Amount Due:</strong> ${amount_due:.2f}</p>
            <p>Please include the invoice code in your payment subject line when paying via Zelle or Venmo.</p>
            <br>
            <p>Payment Methods:</p>
            <ul>
                <li>Zelle: payments@tennisacademy.com</li>
                <li>Venmo: @tennisacademy</li>
            </ul>
            <p>Subject line should be: {invoice_code}</p>
            <br>
            <p>Thank you,<br>Tennis Academy Team</p>
        </body>
        </html>
        """
        
        message = Mail(
            from_email=self.from_email,
            to_emails=user_email,
            subject=subject,
            html_content=html_content
        )
        
        try:
            response = self.sg.send(message)
            return response.status_code == 202
        except Exception as e:
            print(f"Error sending invoice email: {e}")
            return False
    
    def send_class_cancellation(self, user_emails: list, class_date: str, package_name: str):
        """Send class cancellation notification"""
        subject = f"Tennis Class Cancelled - {class_date}"
        
        html_content = f"""
        <html>
        <body>
            <h2>Class Cancellation Notice</h2>
            <p>Dear Tennis Academy Students,</p>
            <p>The {package_name} class scheduled for {class_date} has been cancelled.</p>
            <p>This class will not be charged in your next invoice.</p>
            <p>We apologize for any inconvenience.</p>
            <br>
            <p>Best regards,<br>Tennis Academy Team</p>
        </body>
        </html>
        """
        
        message = Mail(
            from_email=self.from_email,
            to_emails=user_emails,
            subject=subject,
            html_content=html_content
        )
        
        try:
            response = self.sg.send(message)
            return response.status_code == 202
        except Exception as e:
            print(f"Error sending cancellation email: {e}")
            return False 