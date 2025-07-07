import requests
import json
from datetime import datetime

# Production API URL
API_BASE_URL = "https://tennisacademy.onrender.com/api"

def import_data():
    """Import data to production database"""
    
    # Load exported data
    with open('local_data_export.json', 'r') as f:
        data = json.load(f)
    
    print("=== IMPORTING TO PRODUCTION ===")
    
    # First, reset the production database
    print("1. Resetting production database...")
    response = requests.post(f"{API_BASE_URL}/reset_database")
    if response.status_code == 200:
        print("   ✅ Database reset successful")
    else:
        print(f"   ❌ Database reset failed: {response.text}")
        return
    
    # Import class types
    print("2. Importing class types...")
    class_type_map = {}  # Map old IDs to new IDs
    for i, class_type in enumerate(data['class_types']):
        response = requests.post(
            f"{API_BASE_URL}/class_types",
            json={"name": class_type['name']}
        )
        if response.status_code == 200:
            new_id = response.json()['id']
            class_type_map[i] = new_id
            print(f"   ✅ Created class type: {class_type['name']} (ID: {new_id})")
        else:
            print(f"   ❌ Failed to create class type: {class_type['name']}")
    
    # Import packages
    print("3. Importing packages...")
    package_map = {}  # Map old IDs to new IDs
    for i, package in enumerate(data['packages']):
        # Update class_type_id to new ID
        if package['class_type_id']:
            old_class_type_index = package['class_type_id'] - 1  # Assuming sequential IDs
            if old_class_type_index in class_type_map:
                package['class_type_id'] = class_type_map[old_class_type_index]
        
        response = requests.post(
            f"{API_BASE_URL}/packages",
            json=package
        )
        if response.status_code == 200:
            new_id = response.json()['id']
            package_map[i] = new_id
            print(f"   ✅ Created package: {package['name']} (ID: {new_id})")
        else:
            print(f"   ❌ Failed to create package: {package['name']}")
    
    # Import users
    print("4. Importing users...")
    user_map = {}  # Map old IDs to new IDs
    for i, user in enumerate(data['users']):
        response = requests.post(
            f"{API_BASE_URL}/users",
            json=user
        )
        if response.status_code == 200:
            new_id = response.json()['id']
            user_map[i] = new_id
            print(f"   ✅ Created user: {user['name']} (ID: {new_id})")
        else:
            print(f"   ❌ Failed to create user: {user['name']}")
    
    # Import registrations
    print("5. Importing registrations...")
    for registration in data['registrations']:
        # Update user_id and package_id to new IDs
        old_user_index = registration['user_id'] - 1
        old_package_index = registration['package_id'] - 1
        
        if old_user_index in user_map and old_package_index in package_map:
            registration['user_id'] = user_map[old_user_index]
            registration['package_id'] = package_map[old_package_index]
            
            response = requests.post(
                f"{API_BASE_URL}/register",
                json=registration
            )
            if response.status_code == 200:
                print(f"   ✅ Created registration for user {registration['user_id']}")
            else:
                print(f"   ❌ Failed to create registration")
    
    # Import classes
    print("6. Importing classes...")
    class_map = {}  # Map old IDs to new IDs
    for i, class_data in enumerate(data['classes']):
        # Update package_id and class_type_id to new IDs
        if class_data['package_id']:
            old_package_index = class_data['package_id'] - 1
            if old_package_index in package_map:
                class_data['package_id'] = package_map[old_package_index]
        
        if class_data['class_type_id']:
            old_class_type_index = class_data['class_type_id'] - 1
            if old_class_type_index in class_type_map:
                class_data['class_type_id'] = class_type_map[old_class_type_index]
        
        response = requests.post(
            f"{API_BASE_URL}/classes",
            json=class_data
        )
        if response.status_code == 200:
            new_id = response.json()['id']
            class_map[i] = new_id
            print(f"   ✅ Created class for date: {class_data['date']} (ID: {new_id})")
        else:
            print(f"   ❌ Failed to create class for date: {class_data['date']}")
    
    # Import package options
    print("7. Importing package options...")
    for option in data['package_options']:
        # Update package_id to new ID
        old_package_index = option['package_id'] - 1
        if old_package_index in package_map:
            option['package_id'] = package_map[old_package_index]
            
            response = requests.post(
                f"{API_BASE_URL}/packages/{option['package_id']}/options",
                json=option
            )
            if response.status_code == 200:
                print(f"   ✅ Created package option: {option['label']}")
            else:
                print(f"   ❌ Failed to create package option: {option['label']}")
    
    print("\n=== IMPORT COMPLETE ===")
    print("Note: Attendance and payment records were not imported to avoid conflicts.")
    print("You can manually add these if needed.")

if __name__ == "__main__":
    import_data() 