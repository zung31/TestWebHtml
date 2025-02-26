<?php
header('Content-Type: application/json');

require 'db.php';

$data = json_decode(file_get_contents('php://input'), true);
$intitule = $data['intitule'];
$parent_id = isset($data['parent_id']) ? $data['parent_id'] : null;
$created = date('Y-m-d H:i:s');
$modified = $created;

try {
    $query = "INSERT INTO categories (intitule, parent_id, created, modified) VALUES (:intitule, :parent_id, :created, :modified)";
    $stmt = $pdo->prepare($query);
    $stmt->execute([
        ':intitule' => $intitule,
        ':parent_id' => $parent_id, 
        ':created' => $created,
        ':modified' => $modified,
    ]);

    echo json_encode(['success' => true, 'message' => 'Catégorie ajoutée avec succès']);
} catch (PDOException $e) {
    // Trả về phản hồi JSON lỗi
    echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'ajout de la catégorie: ' . $e->getMessage()]);
}
?>