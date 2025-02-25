<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $contactInfo = trim($_POST["contactInfo"]);

    if (!empty($contactInfo)) {
        $to = "fastindustrialsupply@gmail.com";
        $subject = "Solicitud de Cotización - Energía Solar";
        $message = "Un usuario ha solicitado una cotización.\n\nInformación de contacto: $contactInfo";
        $headers = "From: no-reply@energia247.com\r\nReply-To: $contactInfo\r\nContent-Type: text/plain; charset=UTF-8";

        if (mail($to, $subject, $message, $headers)) {
            echo "success";
        } else {
            echo "error";
        }
    } else {
        echo "Por favor, ingrese su información de contacto.";
    }
} else {
    echo "Acceso no permitido.";
}
?>
