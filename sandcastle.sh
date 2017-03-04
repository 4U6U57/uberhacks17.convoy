# Paste your access token in the quotes below
access_token="$1"
request_id="$2"

function change_status {
    curl -X "PUT" "https://sandbox-api.uber.com/v1/sandbox/requests/$2" \
      -H "Authorization: Bearer $access_token" \
      -H "Content-Type: application/json" \
      -d "{\"status\": \"$1\"}"
}

for status in "processing" "accepted" "arriving" "in_progress" "completed"; do
  change_status $status $request_id
  sleep 60
done
