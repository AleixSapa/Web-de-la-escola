import urllib.request
import json

url = "https://hocwnqqdyyinjrtczhdw.supabase.co/rest/v1/"
headers = {
    "apikey": "sb_publishable_X_TrrWex0GfBLIzbKFp1Cg_Xa97mziS",
    "Authorization": "Bearer sb_publishable_X_TrrWex0GfBLIzbKFp1Cg_Xa97mziS"
}

def delete_req():
    req = urllib.request.Request(url + "birthdays?id=eq.1", headers=headers, method="DELETE")
    try:
        with urllib.request.urlopen(req) as response:
            print("DELETE returned STATUS:", response.status)
    except Exception as e:
        print(e)
delete_req()
