# Paste your access token in the quotes below
access_token="$1"

function change_status {
    curl -X "PUT" "https://sandbox-api.uber.com/v1/sandbox/requests/$2" \
      -H "Authorization: Bearer $access_token" \
      -H "Content-Type: application/json" \
      -d "{\"status\": \"$1\"}"
}

echo 'What is the request-id of the sandbox trip you want to modify?'
read request_id

PS3='Please enter your choice: '
options=(
    "processing" 
    "no_drivers_available" 
    "accepted" 
    "arriving" 
    "in_progress" 
    "driver_canceled" 
    "rider_canceled"
    "completed"
    "exit")
select opt in "${options[@]}"
do
    case $opt in
        "processing")
            change_status "processing" $request_id
            ;;
        "no_drivers_available")
            change_status "no_drivers_available" $request_id
            ;;
        "accepted")
            change_status "accepted" $request_id
            ;;
        "arriving")
            change_status "arriving" $request_id
            ;;
        "in_progress")
            change_status "in_progress" $request_id
            ;;
        "driver_canceled")
            change_status "driver_canceled" $request_id
            ;;
        "rider_canceled")
            change_status "rider_canceled" $request_id
            ;;
        "completed")
            change_status "completed" $request_id
            ;;
        "exit")
            break
            ;;
        *) echo invalid option;;
    esac
done
