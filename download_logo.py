import urllib.request

url = "https://lh3.googleusercontent.com/aida/AP1WRLvTZsLsiDNl96jo6oZ6WmkcfxcsnmIjg_KRyX5eqjrKgwwM54N5N78Fm_49y-1Cwk7jyiN0IlEle5GKHyEcpZnlq37SDpNP3Pp2xjcgy9QA2YclgF_LXS2yiGNUsGVQtRWAB5-c--TUJscHiBkrI7eWoEu89f2iEbrtM3LXH8GFoPFLw8K7Kc4CVnQc4_OUQkWs4cAdpqmL94gc2DW73QGOqpfezzutqoxhlQeds6jo-eyVLX9PL1TqCwc"
path = "apps/frontend/public/images/tabibak-logo.png"
print(f"Downloading {url} to {path}")
urllib.request.urlretrieve(url, path)
print("Download complete.")
