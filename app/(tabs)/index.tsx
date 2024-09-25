import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet, 
  Alert, 
  TouchableOpacity 
} from 'react-native';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'; 
import { firestore } from '../firebaseConfig';

// Định nghĩa kiểu dữ liệu cho người dùng
interface User {
  id: string;
  name: string;
  email: string;
  age: number;
}

const App = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingAction, setLoadingAction] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [age, setAge] = useState<number | string>(''); 
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>(''); // Thêm biến searchText
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]); // Thêm biến filteredUsers

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, 'users'), (snapshot) => {
      const usersList: User[] = [];
      snapshot.forEach((doc) => {
        usersList.push({ ...doc.data(), id: doc.id } as User);
      });
      setUsers(usersList);
      setFilteredUsers(usersList); // Cập nhật filteredUsers ban đầu là toàn bộ danh sách
      setLoading(false);
    }, (error) => {
      setLoading(false);
      setError(error.message);
      console.error('Error fetching users: ', error);
    });

    return () => unsubscribe(); 
  }, []);

  // Tìm kiếm danh sách người dùng
  useEffect(() => {
    if (searchText) {
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(searchText.toLowerCase()) || 
        user.email.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users); // Khi không có từ khóa tìm kiếm, hiển thị toàn bộ danh sách
    }
  }, [searchText, users]);

  const addUser = async () => {
    if (name && email && age) { 
      setLoadingAction(true);
      try {
        await addDoc(collection(firestore, 'users'), {
          name,
          email,
          age: Number(age), 
        });
        resetForm();
      } catch (error:any) {
        setError(error.message);
        console.error('Error adding user: ', error);
      } finally {
        setLoadingAction(false);
      }
    } else {
      Alert.alert("Validation Error", "Please fill in all fields.");
    }
  };

  const deleteUser = async (userId: string) => {
    setLoadingAction(true);
    try {
      await deleteDoc(doc(firestore, 'users', userId));
    } catch (error:any) {
      setError(error.message);
      console.error('Error deleting user: ', error);
    } finally {
      setLoadingAction(false);
    }
  };

  const editUser = async () => {
    if (editingUserId && name && email && age) {
      setLoadingAction(true);
      try {
        await updateDoc(doc(firestore, 'users', editingUserId), {
          name,
          email,
          age: Number(age), 
        });
        resetForm();
      } catch (error:any) {
        setError(error.message);
        console.error('Error updating user: ', error);
      } finally {
        setLoadingAction(false);
      }
    } else {
      Alert.alert("Validation Error", "Please fill in all fields.");
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setAge('');
    setEditingUserId(null);
  };

  const startEditUser = (user: User) => {
    setName(user.name);
    setEmail(user.email);
    setAge(user.age.toString());
    setEditingUserId(user.id);
  };

  if (loading) {
    return <ActivityIndicator style={styles.loading} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Management</Text>

      {/* Thanh tìm kiếm */}
      <TextInput
        placeholder="Search users..."
        value={searchText}
        onChangeText={setSearchText}
        style={styles.input}
      />

      <TextInput 
        placeholder="Name" 
        value={name} 
        onChangeText={setName} 
        style={styles.input} 
      />
      <TextInput 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
        style={styles.input} 
        keyboardType="email-address" 
        autoCapitalize="none" 
      />
      <TextInput 
        placeholder="Age" 
        value={age.toString()} 
        onChangeText={setAge} 
        keyboardType="numeric" 
        style={styles.input} 
      />
      <Button 
        title={editingUserId ? "Update User" : "Add User"} 
        onPress={editingUserId ? editUser : addUser} 
        color="#4CAF50" 
      />

      {loadingAction && <ActivityIndicator style={styles.loading} />}

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <FlatList
        data={filteredUsers} // Hiển thị danh sách người dùng đã được lọc
        renderItem={({ item }) => (
          <View style={styles.userItem}>
            <Text style={styles.userText}>
              {item.name} - {item.email} - {item.age} years old
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.editButton]} 
                onPress={() => startEditUser(item)}
              >
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.deleteButton]} 
                onPress={() => deleteUser(item.id)}
              >
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f4f8',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  userItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userText: {
    fontSize: 16,
    color: '#555',
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginLeft: 5,
  },
  editButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loading: {
    marginTop: 50,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 10,
  },
});

export default App;
