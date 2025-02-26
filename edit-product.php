<?php
header('Content-Type: application/json');

require 'db.php';

$data = json_decode(file_get_contents('php://input'), true);
$productId = $data['id'];
$intitule = $data['intitule'];
$descriptif = $data['descriptif'];
$modified = date('Y-m-d H:i:s');

try {
    $query = "UPDATE produits SET intitule = :intitule, descriptif = :descriptif, modified = :modified WHERE id = :id";
    $stmt = $pdo->prepare($query);
    $stmt->execute([
        ':intitule' => $intitule,
        ':descriptif' => $descriptif,
        ':modified' => $modified,
        ':id' => $productId,
    ]);

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour du produit: ' . $e->getMessage()]);
}
?>