#!/usr/bin/env python3
"""
Custom MCP Server for Render Integration
This server provides direct access to Render services via the Render API.
"""

import json
import subprocess
import sys
import os
from typing import Dict, Any, List
import requests
from datetime import datetime

class RenderMCPServer:
    def __init__(self):
        self.api_key = os.getenv('RENDER_API_KEY')
        self.base_url = "https://api.render.com/v1"
        self.services = {}
        
    def get_headers(self):
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def list_services(self) -> List[Dict[str, Any]]:
        """List all services in the account"""
        if not self.api_key:
            return {"error": "RENDER_API_KEY not set"}
        
        try:
            response = requests.get(f"{self.base_url}/services", headers=self.get_headers())
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"error": str(e)}
    
    def get_service(self, service_id: str) -> Dict[str, Any]:
        """Get details of a specific service"""
        if not self.api_key:
            return {"error": "RENDER_API_KEY not set"}
        
        try:
            response = requests.get(f"{self.base_url}/services/{service_id}", headers=self.get_headers())
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"error": str(e)}
    
    def get_service_logs(self, service_id: str) -> Dict[str, Any]:
        """Get logs for a specific service"""
        if not self.api_key:
            return {"error": "RENDER_API_KEY not set"}
        
        try:
            response = requests.get(f"{self.base_url}/services/{service_id}/logs", headers=self.get_headers())
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"error": str(e)}
    
    def deploy_service(self, service_id: str) -> Dict[str, Any]:
        """Trigger a manual deployment for a service"""
        if not self.api_key:
            return {"error": "RENDER_API_KEY not set"}
        
        try:
            response = requests.post(f"{self.base_url}/services/{service_id}/deploys", headers=self.get_headers())
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"error": str(e)}
    
    def get_deployments(self, service_id: str) -> Dict[str, Any]:
        """Get deployment history for a service"""
        if not self.api_key:
            return {"error": "RENDER_API_KEY not set"}
        
        try:
            response = requests.get(f"{self.base_url}/services/{service_id}/deploys", headers=self.get_headers())
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"error": str(e)}

def main():
    server = RenderMCPServer()
    
    # Simple command-line interface for testing
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "list":
            result = server.list_services()
            print(json.dumps(result, indent=2))
        
        elif command == "service" and len(sys.argv) > 2:
            service_id = sys.argv[2]
            result = server.get_service(service_id)
            print(json.dumps(result, indent=2))
        
        elif command == "logs" and len(sys.argv) > 2:
            service_id = sys.argv[2]
            result = server.get_service_logs(service_id)
            print(json.dumps(result, indent=2))
        
        elif command == "deploy" and len(sys.argv) > 2:
            service_id = sys.argv[2]
            result = server.deploy_service(service_id)
            print(json.dumps(result, indent=2))
        
        elif command == "deployments" and len(sys.argv) > 2:
            service_id = sys.argv[2]
            result = server.get_deployments(service_id)
            print(json.dumps(result, indent=2))
        
        else:
            print("Usage:")
            print("  python render-mcp-server.py list")
            print("  python render-mcp-server.py service <service_id>")
            print("  python render-mcp-server.py logs <service_id>")
            print("  python render-mcp-server.py deploy <service_id>")
            print("  python render-mcp-server.py deployments <service_id>")
    else:
        print("Render MCP Server")
        print("Set RENDER_API_KEY environment variable to use")
        print("Usage: python render-mcp-server.py <command>")

if __name__ == "__main__":
    main() 